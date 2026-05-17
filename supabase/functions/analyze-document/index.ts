import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fileBase64, mediaType } = await req.json();

    if (!fileBase64 || !mediaType) {
      return new Response(
        JSON.stringify({ error: "fileBase64 and mediaType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isImage = typeof mediaType === "string" && mediaType.startsWith("image/");
    const contentBlock = isImage
      ? {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: fileBase64 },
        }
      : {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: fileBase64 },
        };

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [contentBlock, { type: "text", text: PROMPT }] as any,
        },
      ],
    });

    const responseText = response.content
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("");

    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(
        JSON.stringify({
          error: `A IA não devolveu dados estruturados válidos. Raw: ${responseText.slice(0, 200)}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const extraction = JSON.parse(match[0]);

    return new Response(JSON.stringify({ extraction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
