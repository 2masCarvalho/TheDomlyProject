import { supabase } from '@/supabase-client';

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

export async function analyzeDocument(file: File): Promise<DocumentExtraction> {
  const fileBase64 = await fileToBase64(file);
  const mediaType = getMediaType(file);

  const { data, error } = await supabase.functions.invoke('analyze-document', {
    body: { fileBase64, mediaType, fileName: file.name },
  });

  // supabase.functions.invoke does NOT throw on non-2xx; it resolves with
  // { data: null, error }. AND a 200 with { error } body resolves with
  // { data: { error }, error: null }. Both must be guarded explicitly.
  if (error) throw new Error(`analyze-document failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  if (!data?.extraction) throw new Error('A IA não devolveu uma extração válida.');

  return data.extraction as DocumentExtraction;
}

export async function analyzeDocumentBatch(
  files: File[],
  onProgress?: (index: number, total: number, fileName: string, status: 'processing' | 'done' | 'error') => void,
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
