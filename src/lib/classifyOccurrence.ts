import { GoogleGenerativeAI } from "@google/generative-ai";

export type ClassifyResult = {
  categoria: string;
  prioridade: string;
};

async function classifyOccurrence(occurrenceName: string): Promise<ClassifyResult> {
  console.log("[classify] API Key defined:", !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log("[classify] Input:", occurrenceName);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Classifica esta ocorrência de gestão de propriedades em português.
Ocorrência: "${occurrenceName}"

Responde APENAS com JSON válido neste formato exato (sem texto adicional, sem comentários):
{"categoria": "Canalização", "prioridade": "Alta"}

Valores válidos para categoria: Estrutural, Canalização, Eletricidade, Elevador, Zona Comum, Seg. Incêndio, Outro
Valores válidos para prioridade: Crítica, Alta, Média, Baixa`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log("[classify] Raw response:", text);

  // Extract the JSON object even if Gemini wraps it in markdown or extra text
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in response: ${text}`);
  console.log("[classify] Cleaned:", match[0]);

  const parsed = JSON.parse(match[0]);
  console.log("[classify] Parsed:", parsed);
  return parsed;
}

export default classifyOccurrence;
