// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

async function callAnthropic(apiKey: string, body: any): Promise<any> {
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

const MODEL = "claude-haiku-4-5-20251001";
const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT = `És o assistente Domly — uma plataforma portuguesa de gestão de condomínios usada por gestores profissionais.

## Como ajudas
- Respondes em português europeu (não brasileiro) ou inglês, dependendo da língua do utilizador.
- És conciso, factual e prático. Nunca inventas dados.
- Quando o utilizador pergunta sobre dados (quantos edifícios, ocorrências, próximas manutenções, etc.), USA SEMPRE as ferramentas disponíveis. Não respondas com base em suposições.
- Quando o utilizador pede um relatório ou PDF, chama a ferramenta apropriada.
- Se faltar contexto (ex: o utilizador pede "gera um PDF" sem indicar qual edifício), pergunta antes de chamar a ferramenta.

## Datas
- "Mês passado" significa o mês anterior ao atual. Hoje é ${new Date().toISOString().slice(0, 10)}.
- Quando precisares de \`ano\` e \`mes\` para o relatório mensal, calcula a partir da data acima.

## Plataforma (para referência quando o utilizador pergunta como fazer algo)
- /dashboard, /condominios, /ocorrencias, /trabalhos, /tecnicos, /conformidade, /calendario, /alertas, /manutencao, /relatorios, /configuracoes, /suporte
- Estados de ocorrência: reportada → triagem → em_progresso → resolvida → fechada
- Estados de trabalho: aberto → atribuido → em_progresso → concluido / cancelado
- Prioridades: critica, alta, media, baixa`;

// ─────────────────────────────────────────────────────────────────────────────
// Tool definitions sent to Anthropic
// ─────────────────────────────────────────────────────────────────────────────

const tools: any[] = [
  {
    name: "count_resources",
    description:
      "Conta quantos registos existem de um recurso. Use `filter: 'open'` para ocorrências/trabalhos que ainda não foram resolvidos/concluídos.",
    input_schema: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          enum: ["condominios", "ativos", "ocorrencias", "trabalhos", "tecnicos"],
        },
        filter: {
          type: "string",
          enum: ["open", "closed", "all"],
          description:
            "Apenas relevante para ocorrencias/trabalhos. 'open' = não resolvido/concluído. Default: 'all'.",
        },
      },
      required: ["resource"],
    },
  },
  {
    name: "list_buildings",
    description:
      "Lista os condomínios do utilizador com nome, cidade, número de frações, contagem de ativos e ocorrências em aberto.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
    },
  },
  {
    name: "list_open_ocorrencias",
    description:
      "Lista ocorrências em aberto (não resolvidas nem fechadas), ordenadas por prioridade.",
    input_schema: {
      type: "object",
      properties: {
        condo_id: { type: "integer", description: "Opcional: filtrar por um condomínio específico." },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
      },
    },
  },
  {
    name: "next_maintenance",
    description:
      "Próximas manutenções programadas de ativos (com base em data_proxima_manutencao). Inclui ativos cuja data já passou (atrasada) até `days_ahead` no futuro.",
    input_schema: {
      type: "object",
      properties: {
        days_ahead: { type: "integer", minimum: 1, maximum: 365, default: 60 },
        condo_id: { type: "integer" },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
      },
    },
  },
  {
    name: "list_expiring_assets",
    description:
      "Ativos cujas licenças expiram nos próximos `days_ahead` dias (extintores, SADI, gás, seguros, licenças de elevador, etc.).",
    input_schema: {
      type: "object",
      properties: {
        days_ahead: { type: "integer", minimum: 1, maximum: 365, default: 60 },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
      },
    },
  },
  {
    name: "generate_monthly_report",
    description:
      "Gera um relatório operacional mensal para um condomínio. O sistema agrega ocorrências, trabalhos, manutenções e ativos, e produz um resumo executivo escrito por IA. Devolve um ID que o utilizador pode abrir.",
    input_schema: {
      type: "object",
      properties: {
        condo_id: { type: "integer" },
        ano: { type: "integer", minimum: 2020, maximum: 2100 },
        mes: { type: "integer", minimum: 1, maximum: 12 },
      },
      required: ["condo_id", "ano", "mes"],
    },
  },
  {
    name: "request_building_pdf",
    description:
      "Sinaliza ao cliente para gerar um PDF detalhado de um edifício (dados, ativos, ocorrências, trabalhos). O PDF é construído no browser do utilizador.",
    input_schema: {
      type: "object",
      properties: {
        condo_id: { type: "integer" },
      },
      required: ["condo_id"],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tool implementations (run against Supabase with caller's JWT, so RLS applies)
// ─────────────────────────────────────────────────────────────────────────────

interface ChatAction {
  type: "open_report" | "building_pdf";
  [key: string]: any;
}

async function executeTool(
  name: string,
  input: any,
  supabase: SupabaseClient,
  authHeader: string,
): Promise<{ result: any; action?: ChatAction; isError?: boolean }> {
  switch (name) {
    case "count_resources": {
      const resource = input.resource;
      const filter = input.filter ?? "all";

      if (resource === "condominios") {
        const { count, error } = await supabase
          .from("condominios")
          .select("id_comdominio", { count: "exact", head: true })
          .eq("is_active", true);
        if (error) throw error;
        return { result: { resource, count: count ?? 0 } };
      }

      if (resource === "ativos") {
        const { count, error } = await supabase
          .from("ativos")
          .select("id_ativo", { count: "exact", head: true });
        if (error) throw error;
        return { result: { resource, count: count ?? 0 } };
      }

      if (resource === "tecnicos") {
        const { count, error } = await supabase
          .from("tecnicos")
          .select("id_tecnico", { count: "exact", head: true });
        if (error) throw error;
        return { result: { resource, count: count ?? 0 } };
      }

      if (resource === "ocorrencias") {
        let q = supabase.from("ocorrencias").select("id_ocorrencia", { count: "exact", head: true });
        if (filter === "open") q = q.not("estado", "in", '("resolvida","fechada")');
        if (filter === "closed") q = q.in("estado", ["resolvida", "fechada"]);
        const { count, error } = await q;
        if (error) throw error;
        return { result: { resource, filter, count: count ?? 0 } };
      }

      if (resource === "trabalhos") {
        let q = supabase
          .from("trabalhos_manutencao")
          .select("id_trabalho", { count: "exact", head: true });
        if (filter === "open") q = q.not("estado", "in", '("concluido","cancelado")');
        if (filter === "closed") q = q.in("estado", ["concluido", "cancelado"]);
        const { count, error } = await q;
        if (error) throw error;
        return { result: { resource, filter, count: count ?? 0 } };
      }

      return { result: { error: `Recurso desconhecido: ${resource}` }, isError: true };
    }

    case "list_buildings": {
      const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
      const { data: condos, error } = await supabase
        .from("condominios")
        .select("id_comdominio, nome, cidade, morada, num_fracoes")
        .eq("is_active", true)
        .order("nome", { ascending: true })
        .limit(limit);
      if (error) throw error;

      // Per-building counts in parallel — n is bounded by limit (<=50).
      const enriched = await Promise.all(
        (condos ?? []).map(async (c: any) => {
          const [ativosResp, ocorrResp] = await Promise.all([
            supabase
              .from("ativos")
              .select("id_ativo", { count: "exact", head: true })
              .eq("id_condominio", c.id_comdominio),
            supabase
              .from("ocorrencias")
              .select("id_ocorrencia", { count: "exact", head: true })
              .eq("id_condominio", c.id_comdominio)
              .not("estado", "in", '("resolvida","fechada")'),
          ]);
          return {
            id: c.id_comdominio,
            nome: c.nome,
            cidade: c.cidade,
            morada: c.morada,
            num_fracoes: c.num_fracoes,
            num_ativos: ativosResp.count ?? 0,
            num_open_ocorrencias: ocorrResp.count ?? 0,
          };
        }),
      );
      return { result: { buildings: enriched } };
    }

    case "list_open_ocorrencias": {
      const limit = Math.min(Math.max(input.limit ?? 10, 1), 20);
      let q = supabase
        .from("ocorrencias")
        .select(
          "id_ocorrencia, titulo, categoria, prioridade, estado, created_at, id_condominio, condominios:id_condominio(nome)",
        )
        .not("estado", "in", '("resolvida","fechada")')
        .order("prioridade", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (input.condo_id) q = q.eq("id_condominio", input.condo_id);
      const { data, error } = await q;
      if (error) throw error;
      return {
        result: {
          ocorrencias: (data ?? []).map((o: any) => ({
            id: o.id_ocorrencia,
            titulo: o.titulo,
            categoria: o.categoria,
            prioridade: o.prioridade,
            estado: o.estado,
            condo_name: o.condominios?.nome ?? null,
            created_at: o.created_at,
          })),
        },
      };
    }

    case "next_maintenance": {
      const daysAhead = Math.min(Math.max(input.days_ahead ?? 60, 1), 365);
      const limit = Math.min(Math.max(input.limit ?? 10, 1), 20);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + daysAhead);

      let q = supabase
        .from("ativos")
        .select(
          "id_ativo, nome, tipo_ativo, data_proxima_manutencao, id_condominio, condominios:id_condominio(nome)",
        )
        .not("data_proxima_manutencao", "is", null)
        .lte("data_proxima_manutencao", cutoff.toISOString().slice(0, 10))
        .order("data_proxima_manutencao", { ascending: true })
        .limit(limit);
      if (input.condo_id) q = q.eq("id_condominio", input.condo_id);
      const { data, error } = await q;
      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        result: {
          items: (data ?? []).map((a: any) => {
            const due = new Date(a.data_proxima_manutencao);
            const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
            return {
              ativo_id: a.id_ativo,
              ativo_nome: a.nome,
              tipo_ativo: a.tipo_ativo,
              condo_name: a.condominios?.nome ?? null,
              data_proxima_manutencao: a.data_proxima_manutencao,
              dias_restantes: diffDays,
              estado: diffDays < 0 ? "atrasada" : "agendada",
            };
          }),
        },
      };
    }

    case "list_expiring_assets": {
      const daysAhead = Math.min(Math.max(input.days_ahead ?? 60, 1), 365);
      const limit = Math.min(Math.max(input.limit ?? 10, 1), 20);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() + daysAhead);

      const { data, error } = await supabase
        .from("ativos")
        .select(
          "id_ativo, nome, tipo_ativo, data_expiracao, estado_licenca, condominios:id_condominio(nome)",
        )
        .not("data_expiracao", "is", null)
        .lte("data_expiracao", cutoff.toISOString().slice(0, 10))
        .order("data_expiracao", { ascending: true })
        .limit(limit);
      if (error) throw error;

      return {
        result: {
          items: (data ?? []).map((a: any) => {
            const exp = new Date(a.data_expiracao);
            const diffDays = Math.round((exp.getTime() - today.getTime()) / 86_400_000);
            return {
              ativo_id: a.id_ativo,
              nome: a.nome,
              tipo_ativo: a.tipo_ativo,
              estado_licenca: a.estado_licenca,
              condo_name: a.condominios?.nome ?? null,
              data_expiracao: a.data_expiracao,
              dias_restantes: diffDays,
            };
          }),
        },
      };
    }

    case "generate_monthly_report": {
      const { condo_id, ano, mes } = input;
      if (!condo_id || !ano || !mes) {
        return {
          result: { error: "Faltam parâmetros: condo_id, ano, mes." },
          isError: true,
        };
      }

      // Confirm the user owns this condomínio (and get the name for the action label).
      const { data: condo, error: condoError } = await supabase
        .from("condominios")
        .select("id_comdominio, nome")
        .eq("id_comdominio", condo_id)
        .maybeSingle();
      if (condoError) throw condoError;
      if (!condo) {
        return {
          result: { error: `Condomínio ${condo_id} não encontrado ou sem permissão.` },
          isError: true,
        };
      }

      // Compute data_json via the SQL function (same path the client uses).
      const { data: dataJson, error: rpcError } = await supabase.rpc(
        "compute_monthly_report_data",
        { p_condo: condo_id, p_ano: ano, p_mes: mes },
      );
      if (rpcError) throw rpcError;

      // Upsert the pending row.
      const { data: upserted, error: upsertError } = await supabase
        .from("relatorios_mensais")
        .upsert(
          {
            id_condominio: condo_id,
            ano,
            mes,
            status: "pending",
            data_json: dataJson,
            summary_md: null,
            error_message: null,
            generated_at: new Date().toISOString(),
          },
          { onConflict: "id_condominio,ano,mes" },
        )
        .select("id_relatorio")
        .single();
      if (upsertError) throw upsertError;

      // Invoke the narrative function (forwards caller's JWT via global headers).
      const narrativeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-monthly-report`;
      const narrativeRes = await fetch(narrativeUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        },
        body: JSON.stringify({ id_relatorio: upserted.id_relatorio }),
      });
      const narrativeBody = await narrativeRes.json().catch(() => ({}));

      if (!narrativeRes.ok || narrativeBody?.error) {
        return {
          result: {
            report_id: upserted.id_relatorio,
            condo_name: condo.nome,
            warning: `Relatório criado mas o resumo executivo falhou: ${narrativeBody?.error ?? narrativeRes.statusText}. O utilizador pode tentar regerar a partir da página.`,
          },
          action: { type: "open_report", report_id: upserted.id_relatorio, label: `Abrir relatório ${condo.nome}` },
        };
      }

      return {
        result: {
          report_id: upserted.id_relatorio,
          condo_name: condo.nome,
          status: "ready",
        },
        action: { type: "open_report", report_id: upserted.id_relatorio, label: `Abrir relatório ${condo.nome}` },
      };
    }

    case "request_building_pdf": {
      const { condo_id } = input;
      const { data: condo, error } = await supabase
        .from("condominios")
        .select("id_comdominio, nome")
        .eq("id_comdominio", condo_id)
        .maybeSingle();
      if (error) throw error;
      if (!condo) {
        return {
          result: { error: `Condomínio ${condo_id} não encontrado ou sem permissão.` },
          isError: true,
        };
      }
      return {
        result: { condo_id, condo_name: condo.nome, status: "ready_for_client" },
        action: { type: "building_pdf", condo_id, condo_name: condo.nome },
      };
    }

    default:
      return { result: { error: `Ferramenta desconhecida: ${name}` }, isError: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler — tool-use loop
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    // Preflight: status 204 with CORS headers, no body.
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { messages: incomingMessages } = await req.json();
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Lista de mensagens vazia." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("[chat] ANTHROPIC_API_KEY não está definido nos secrets do Supabase.");
      return new Response(
        JSON.stringify({
          error:
            "Configuração em falta: ANTHROPIC_API_KEY não está definido. Define o secret na consola Supabase em Project Settings → Edge Functions.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Sessão expirada. Faz login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const messages: any[] = [...incomingMessages];
    const collectedActions: ChatAction[] = [];
    let finalText = "";

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const response = await callAnthropic(apiKey, {
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      // Always extract any text content the model produced this turn (it may
      // explain what it's about to do BEFORE calling a tool).
      const iterText = response.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
        .trim();
      if (iterText) finalText = iterText;

      if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
        break;
      }

      if (response.stop_reason !== "tool_use") {
        // Unexpected stop reason (max_tokens, etc.) — bail with whatever text we have.
        break;
      }

      // Persist the assistant turn (with tool_use blocks intact) before adding
      // tool_result, otherwise the Anthropic API rejects the conversation.
      messages.push({ role: "assistant", content: response.content as any });

      const toolUses = response.content.filter((b: any) => b.type === "tool_use") as any[];
      const toolResultContent: any[] = [];
      for (const tu of toolUses) {
        try {
          const { result, action, isError } = await executeTool(tu.name, tu.input, supabase, authHeader);
          if (action) collectedActions.push(action);
          toolResultContent.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(result),
            is_error: !!isError,
          });
        } catch (err) {
          const message = (err as Error).message ?? "Erro desconhecido";
          console.error(`[chat] tool '${tu.name}' falhou:`, message);
          toolResultContent.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify({ error: message }),
            is_error: true,
          });
        }
      }
      messages.push({ role: "user", content: toolResultContent });
    }

    return new Response(
      JSON.stringify({
        text: finalText || "Não consegui processar essa pergunta. Reformula, por favor.",
        actions: collectedActions,
        // legacy compatibility for any older client
        reply: finalText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = (error as Error).message ?? "Erro desconhecido";
    console.error("[chat] erro inesperado:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
