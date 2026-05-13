import { GoogleGenAI } from "@google/genai";

type SummarizeInput = {
  ticker: string;
  name: string | null;
  currentPrice: number | null;
  dayChangePct: number | null;
};

export async function summarizeTicker(
  input: SummarizeInput,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set" };

  const priceLine =
    input.currentPrice != null && input.dayChangePct != null
      ? `Current price: $${input.currentPrice.toFixed(2)} (${input.dayChangePct >= 0 ? "+" : ""}${input.dayChangePct.toFixed(2)}% today). `
      : "";
  const nameLine = input.name ? `Company: ${input.name}. ` : "";

  const prompt = `You are a concise financial briefing assistant for a personal portfolio tracker. Generate a 2-3 sentence morning briefing for ticker ${input.ticker}.

${nameLine}${priceLine}

Cover, in this order:
1. The most material news or price catalyst from the past 24-48 hours (factual, source-grounded)
2. Notable analyst commentary or price-target changes — cite the analyst/firm, do not state your own price target
3. Brief qualitative outlook framed as "consensus is..." or "coverage suggests..." — do not predict prices yourself

Constraints:
- Total length under 350 characters
- Plain text only, no markdown, no bullet points, no headers
- Do not include the ticker price or % change (the user already sees that)
- If the past 24h have no notable news, say so plainly`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        tools: [{ googleSearch: {} }],
      },
    });
    const text = response.text?.trim();
    if (!text) return { ok: false, error: "empty response" };
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
