import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, topic, difficulty = "beginner" } = await req.json();

    if (!text || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Escreve pelo menos algumas frases para receber feedback." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Configuração de IA - Suporta múltiplas APIs
    const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "gemini"; // openai, gemini, lovable
    
    let aiResponse: Response;
    
    if (AI_PROVIDER === "openai") {
      // OpenAI (ChatGPT) - Recomendado
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

      aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // ou "gpt-4o" para melhor qualidade
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt + "\n\nReturn ONLY a valid JSON object with the required fields." },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });
    } else if (AI_PROVIDER === "gemini") {
      // Google Gemini - Gratuito até 15 RPM
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

      aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt + "\n\n" + userPrompt + "\n\nReturn ONLY a valid JSON object with the required fields." }]
          }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      });
    } else {
      // Lovable (original) - MODELO CORRIGIDO
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-1.5-flash", // CORRIGIDO: era "google/gemini-3-flash-preview"
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_feedback",
              description: "Return the writing feedback",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  grammar: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        error: { type: "string" },
                        correction: { type: "string" },
                        explanation: { type: "string" },
                      },
                      required: ["error", "correction", "explanation"],
                    },
                  },
                  vocabulary: { type: "string" },
                  structure: { type: "string" },
                  positives: { type: "array", items: { type: "string" } },
                  suggestions: { type: "array", items: { type: "string" } },
                  corrected_text: { type: "string" },
                },
                required: ["score", "grammar", "vocabulary", "structure", "positives", "suggestions", "corrected_text"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_feedback" } },
        }),
      });
    }

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em breve." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos AI esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let feedback;

    // Parse response baseado no provider
    if (AI_PROVIDER === "openai") {
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in response");
      feedback = JSON.parse(content);
    } else if (AI_PROVIDER === "gemini") {
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("No content in response");
      feedback = JSON.parse(content);
    } else {
      // Lovable (original)
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in response");
      feedback = JSON.parse(toolCall.function.arguments);
    }

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
