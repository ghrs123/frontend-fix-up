import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const { text, topic, difficulty = "beginner" } = await req.json();

    if (!text || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Escreve pelo menos algumas frases para receber feedback." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an English writing tutor for Portuguese-speaking students (level: ${difficulty}).
Analyze the student's English text and provide feedback IN PORTUGUESE.

Return a JSON object with:
- "score": number 1-10 (overall quality)
- "grammar": array of objects with "error" (the mistake), "correction" (the fix), "explanation" (in Portuguese)
- "vocabulary": string with vocabulary feedback in Portuguese  
- "structure": string with structure/organization feedback in Portuguese
- "positives": array of strings with positive aspects in Portuguese
- "suggestions": array of strings with improvement suggestions in Portuguese
- "corrected_text": the full corrected version of the text

Be encouraging but honest. Focus on the most important errors.`;

    const userPrompt = `Topic: "${topic || 'Free writing'}"

Student's text:
"""
${text}
"""

Analyze this text and provide detailed feedback.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em breve." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos AI esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA", details: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("No content in response");
    const feedback = JSON.parse(content);

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("review-writing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
