// Runs with `verify_jwt = false` (see supabase/config.toml). OnboardingPage.tsx
// invokes this BEFORE supabase.auth.signUp completes — there is no JWT yet.
// Input is a short user-supplied title; output is a small classification.
// No PII is written, no destructive side effects. Anonymous access is acceptable.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { titulo } = await req.json();

    if (!titulo || typeof titulo !== "string" || titulo.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "titulo (string, min 3 chars) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured on the server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = `Classifica esta ocorrência de gestão de propriedades em português.
Ocorrência: "${titulo}"

Responde APENAS com JSON válido neste formato exato (sem texto adicional, sem comentários):
{"categoria": "Canalização", "prioridade": "Alta"}

Valores válidos para categoria: Estrutural, Canalização, Eletricidade, Elevador, Zona Comum, Seg. Incêndio, Outro
Valores válidos para prioridade: Crítica, Alta, Média, Baixa`;

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!geminiResp.ok) {
      const errBody = await geminiResp.text();
      return new Response(
        JSON.stringify({ error: `Gemini error ${geminiResp.status}: ${errBody.slice(0, 300)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiJson = await geminiResp.json();
    const text: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: `No JSON found in Gemini response: ${text.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = JSON.parse(match[0]);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
