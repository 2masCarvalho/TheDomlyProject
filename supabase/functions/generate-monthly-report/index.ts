import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

async function callAnthropic(apiKey: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Anthropic returned non-JSON: ${text.slice(0, 200)}`);
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const SYSTEM_PROMPT = `És um analista de operações para uma empresa de gestão de condomínios em Portugal. \
Escreves resumos executivos curtos, factuais e em português europeu (não brasileiro). \
Não inventas números — usa apenas os dados fornecidos. \
Não usas tom comercial, não exageras conquistas, não fazes recomendações vagas.`;

function buildUserPrompt(condoName: string, ano: number, mes: number, data: any): string {
  const periodo = `${MONTHS_PT[mes - 1]} de ${ano}`;
  return `Escreve um resumo executivo do mês de ${periodo} para o condomínio "${condoName}".

Dados agregados:
${JSON.stringify(data, null, 2)}

Estrutura obrigatória (3 parágrafos curtos, máximo 250 palavras no total, sem títulos, sem listas, em markdown simples):
1. Visão geral do mês — número de ocorrências reportadas vs. resolvidas, número de trabalhos concluídos, e investimento em manutenção se disponível.
2. Pontos de atenção — categorias com mais ocorrências, prioridade crítica/alta se relevante, ativos não conformes ou perto de expirar.
3. Prioridades para o próximo mês — focado nas ativos que expiram nos próximos 30 dias e ocorrências por resolver.

Regras:
- Se um número for zero ou os dados não existirem, não menciones essa secção.
- Não uses linguagem promocional ("excelente desempenho", "ótimos resultados").
- Não inventes dados — só usa o que vem no JSON.
- Devolve apenas o markdown final, sem comentários introdutórios.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    // Preflight: status 204 with CORS headers, no body.
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { id_relatorio } = await req.json();
    if (!id_relatorio) {
      return new Response(
        JSON.stringify({ error: "id_relatorio é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use the caller's JWT so RLS scopes the row to their condomínios.
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: rel, error: loadError } = await supabase
      .from("relatorios_mensais")
      .select("id_relatorio, id_condominio, ano, mes, status, data_json, summary_md")
      .eq("id_relatorio", id_relatorio)
      .single();

    if (loadError || !rel) {
      return new Response(
        JSON.stringify({ error: "Relatório não encontrado ou sem permissão." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Idempotent: if already ready, return what we have.
    if (rel.status === "ready" && rel.summary_md) {
      return new Response(
        JSON.stringify({ status: "ready", summary_md: rel.summary_md }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch condomínio name for the prompt
    const { data: condo } = await supabase
      .from("condominios")
      .select("nome")
      .eq("id_comdominio", rel.id_condominio)
      .single();

    await supabase
      .from("relatorios_mensais")
      .update({ status: "generating", error_message: null })
      .eq("id_relatorio", id_relatorio);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY não está definido nos secrets do Supabase. Define-o em Project Settings → Edge Functions.",
      );
    }

    const response = await callAnthropic(apiKey, {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(condo?.nome ?? "este condomínio", rel.ano, rel.mes, rel.data_json),
        },
      ],
    });

    const text = (response.content ?? [])
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    // Strip ```markdown ... ``` fences if the model added them.
    const summary_md = text
      .replace(/^```(?:markdown)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    if (!summary_md) {
      throw new Error("A IA devolveu uma resposta vazia.");
    }

    const { error: updateError } = await supabase
      .from("relatorios_mensais")
      .update({ status: "ready", summary_md, error_message: null })
      .eq("id_relatorio", id_relatorio);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ status: "ready", summary_md }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = (error as Error).message ?? "Erro desconhecido";
    try {
      const { id_relatorio } = await req.clone().json();
      if (id_relatorio) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase
          .from("relatorios_mensais")
          .update({ status: "failed", error_message: message })
          .eq("id_relatorio", id_relatorio);
      }
    } catch {
      // best-effort; don't mask the original error
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
