import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { word, definition, examples } = await req.json();
    if (!word || !definition) {
      return new Response(JSON.stringify({ error: "word and definition are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Translate the following English dictionary entry to Portuguese (European/PT-PT).

Word: ${word}
Definition: ${definition}
${examples?.length ? `Examples: ${examples.join("; ")}` : ""}

Return ONLY a JSON object with:
- "translation": the Portuguese translation of the word (1-3 words max)
- "definition_pt": the definition translated to Portuguese (concise)
${examples?.length ? '- "examples_pt": array of translated examples' : ""}

Return ONLY valid JSON, no markdown.`;

    // Configuração de IA - Suporta múltiplas APIs
    const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "openai"; // openai, gemini, lovable
    
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
            { role: "system", content: "You are a precise English-to-Portuguese translator. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
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
            parts: [{ text: "You are a precise English-to-Portuguese translator. Return only valid JSON.\n\n" + prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });
    } else {
      // Lovable (original) - MODELO CORRIGIDO
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-1.5-flash", // CORRIGIDO: era "google/gemini-3-flash-preview"
          messages: [
            { role: "system", content: "You are a precise English-to-Portuguese translator. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_translation",
              description: "Return the translated dictionary entry",
              parameters: {
                type: "object",
                properties: {
                  translation: { type: "string", description: "Portuguese translation of the word" },
                  definition_pt: { type: "string", description: "Definition in Portuguese" },
                  examples_pt: { type: "array", items: { type: "string" }, description: "Translated examples" },
                },
                required: ["translation", "definition_pt"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_translation" } },
        }),
      });
    }

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let result;

    // Parse response baseado no provider
    if (AI_PROVIDER === "openai") {
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in response");
      result = JSON.parse(content);
    } else if (AI_PROVIDER === "gemini") {
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("No content in response");
      result = JSON.parse(content);
    } else {
      // Lovable (original)
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in response");
      result = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-definition error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
