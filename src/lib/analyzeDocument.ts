// src/lib/analyzeDocument.ts

export type DocumentExtraction = {
  tipo_documento: string;
  categoria: string;
  resumo: string;
  data_inicio: string | null;
  data_expiracao: string | null;
  valor_monetario: number | null;
  entidade: string | null;
  alertas_sugeridos: Array<{
    titulo: string;
    data: string;
    tipo: string;
  }>;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMediaType(file: File): string {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'application/pdf';
  if (file.type === 'image/jpeg' || /\.(jpg|jpeg)$/i.test(file.name)) return 'image/jpeg';
  if (file.type === 'image/png' || file.name.endsWith('.png')) return 'image/png';
  return file.type || 'application/octet-stream';
}

const PROMPT = `Analisa este documento de gestão de condomínios em Portugal e extrai informação estruturada.

Responde APENAS com JSON válido neste formato exato (sem texto adicional, sem markdown, sem backticks):
{
  "tipo_documento": "seguro",
  "categoria": "legal",
  "resumo": "Apólice de seguro multirriscos do edifício, válida até dezembro 2025.",
  "data_inicio": "2024-01-15",
  "data_expiracao": "2025-12-31",
  "valor_monetario": 1250.00,
  "entidade": "Fidelidade Seguros",
  "alertas_sugeridos": [
    {
      "titulo": "Renovação do seguro multirriscos",
      "data": "2025-11-30",
      "tipo": "renovacao"
    }
  ]
}

Regras:
- tipo_documento: um de [contrato, seguro, ata, fatura, inspecao, licenca, certificado, orcamento, outro]
- categoria: um de [legal, financeiro, manutencao, comunicacao, outro]
- resumo: máximo 2 frases em português
- Datas em formato ISO (YYYY-MM-DD). Se não encontrares, usa null.
- valor_monetario: em euros, sem símbolo. Se não encontrares, usa null.
- entidade: nome da empresa/seguradora/entidade principal. Se não encontrares, usa null.
- alertas_sugeridos: sugere alertas úteis baseados nas datas encontradas (ex: renovação 30 dias antes da expiração). Array vazio se não houver datas relevantes.
- Se o documento estiver ilegível ou não for relacionado com gestão de condomínios, preenche o que conseguires e coloca "outro" nos campos de tipo/categoria.`;

export async function analyzeDocument(file: File): Promise<DocumentExtraction> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY não configurada');

  console.log('[analyzeDoc] Processing:', file.name, file.type, `${(file.size / 1024).toFixed(0)} KB`);

  const base64 = await fileToBase64(file);
  const mediaType = getMediaType(file);

  // Claude suporta PDF e imagens nativamente como "document" ou "image"
  const isImage = mediaType.startsWith('image/');

  const contentBlock = isImage
    ? {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      }
    : {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error ${response.status}: ${err?.error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  const responseText = data.content?.map((b: any) => b.text ?? '').join('') ?? '';

  console.log('[analyzeDoc] Raw response:', responseText);

  const match = responseText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('A IA não devolveu dados estruturados válidos.');

  const parsed = JSON.parse(match[0]) as DocumentExtraction;
  console.log('[analyzeDoc] Parsed:', parsed);

  return parsed;
}

export async function analyzeDocumentBatch(
  files: File[],
  onProgress?: (index: number, total: number, fileName: string, status: 'processing' | 'done' | 'error') => void
): Promise<Array<{ file: File; result?: DocumentExtraction; error?: string }>> {
  const results: Array<{ file: File; result?: DocumentExtraction; error?: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i, files.length, file.name, 'processing');

    try {
      const result = await analyzeDocument(file);
      results.push({ file, result });
      onProgress?.(i, files.length, file.name, 'done');
    } catch (err: any) {
      console.error(`[analyzeDoc] Error processing ${file.name}:`, err);
      results.push({ file, error: err?.message || 'Erro desconhecido' });
      onProgress?.(i, files.length, file.name, 'error');
    }

    if (i < files.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}