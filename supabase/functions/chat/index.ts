import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Domly Assistant, a friendly and knowledgeable support chatbot for the Domly property management platform, used by property managers in Portugal.

## About Domly
Domly is a platform for managing residential condominiums. It helps property managers track assets, handle incidents, schedule maintenance, manage technicians, and ensure compliance.

## Platform Sections
- **Dashboard** (/dashboard): KPI overview — condomínios, total ativos, investment, active alerts, upcoming maintenances, open ocorrências, and asset renewals within 60 days.
- **Condomínios** (/condominios): Add and manage condominium buildings. Each condomínio has fields like address, NIF, IBAN, number of floors, elevator info, insurance policy, etc. Clicking a condomínio shows its ativos.
- **Ocorrências** (/ocorrencias): Report and track incidents (structural, plumbing, electrical, elevator, common areas, fire safety, other). Each has a priority (crítica/alta/média/baixa), a status (reportada → triagem → em_progresso → resolvida → fechada), and can be linked to a maintenance job.
- **Trabalhos** (/trabalhos): Maintenance job postings. Can be linked to an ocorrência. Assign a técnico, track status (aberto → atribuído → em_progresso → concluído → cancelado).
- **Técnicos** (/tecnicos): Directory of technicians with specialties, availability, zone, and ratings.
- **Conformidade** (/conformidade): Compliance dashboard for asset licenses and inspections.
- **Calendário** (/calendario): Calendar view of scheduled events and maintenances.
- **Alertas** (/alertas): Alerts for pending maintenances, expiring licenses, and other issues.
- **Manutenção** (/manutencao): Full maintenance history — log interventions with cost, type (preventiva/corretiva), and status.
- **Definições** (/configuracoes): Profile settings — change name, company, avatar, email, password, and subscription.

## How to answer
- Respond in the same language the user writes in (Portuguese or English).
- Be concise, friendly, and practical. Give step-by-step instructions referencing real UI labels.
- If the user asks about their own data, use the context provided below.
- If you don't know something specific about the user's data, say so and suggest where to find it in the app.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    let contextNote = "";
    if (context) {
      contextNote = `\n\n## User's current data\n- Condomínios: ${context.condominios}\n- Ativos: ${context.ativos}\n- Ocorrências em aberto: ${context.openOcorrencias}`;
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextNote,
      messages,
    });

    const content = response.content[0];
    const text = content.type === "text" ? content.text : "";

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
