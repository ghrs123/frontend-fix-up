import { getEnv } from "./supabase.ts";

export type GeminiGenerateOpts = {
  system?: string;
  user: string;
  temperature?: number;
  responseMimeType?: string; // "application/json" quando quiser JSON
};

export async function geminiGenerate(opts: GeminiGenerateOpts): Promise<string> {
  const key = getEnv("GEMINI_API_KEY");

  // Modelo recomendado: alias estável (evita quebrar quando versões são removidas)
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const body = {
    contents: [
      ...(opts.system
        ? [{ role: "user", parts: [{ text: opts.system }] }]
        : []),
      { role: "user", parts: [{ text: opts.user }] },
    ],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${details}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
