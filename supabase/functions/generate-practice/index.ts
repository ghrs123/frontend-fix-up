import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { exerciseType = "mixed", difficulty = "beginner" } = await req.json();

    // Fetch user's flashcards
    const { data: flashcards, error: fcError } = await supabase
      .from("flashcards")
      .select("word, translation, definition, example_sentence")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(30);

    if (fcError) throw fcError;

    if (!flashcards || flashcards.length === 0) {
      return new Response(
        JSON.stringify({ error: "Precisas de ter flashcards para gerar exercícios. Adiciona palavras aos teus flashcards primeiro!" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wordList = flashcards.map(f => `${f.word} (${f.translation})`).join(", ");

    const systemPrompt = `You are an English language teacher for Portuguese-speaking students. 
Generate practice exercises using ONLY these vocabulary words from the student's flashcards: ${wordList}.

IMPORTANT: 
- All instructions must be in Portuguese.
- The exercises must practice these specific English words.
- Difficulty level: ${difficulty}.
- Return a JSON object with the key "exercises" containing an array of exactly 5 exercises.`;

    let exercisePrompt = "";
    if (exerciseType === "fill-blank") {
      exercisePrompt = `Generate 5 fill-in-the-blank exercises. Each exercise should have:
- "type": "fill-blank"
- "instruction": instruction in Portuguese
- "sentence": English sentence with ___ for the blank
- "answer": the correct word
- "hint": a hint in Portuguese
- "options": array of 4 options including the correct answer`;
    } else if (exerciseType === "translate") {
      exercisePrompt = `Generate 5 translation exercises. Each exercise should have:
- "type": "translate"  
- "instruction": instruction in Portuguese
- "sentence": sentence to translate (alternate EN->PT and PT->EN)
- "answer": the correct translation
- "direction": "en-pt" or "pt-en"`;
    } else if (exerciseType === "match") {
      exercisePrompt = `Generate 5 matching exercises. Each exercise should have:
- "type": "match"
- "instruction": instruction in Portuguese
- "pairs": array of 4 objects with "english" and "portuguese" keys
The pairs should use the student's vocabulary words.`;
    } else {
      exercisePrompt = `Generate 5 mixed exercises (2 fill-in-the-blank, 2 translation, 1 matching). Use the formats:
Fill-blank: {"type":"fill-blank","instruction":"...","sentence":"...","answer":"...","hint":"...","options":["...","...","...","..."]}
Translate: {"type":"translate","instruction":"...","sentence":"...","answer":"...","direction":"en-pt"|"pt-en"}
Match: {"type":"match","instruction":"...","pairs":[{"english":"...","portuguese":"..."},...]}`;
    }

    // Configuração de IA - Suporta múltiplas APIs
    const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "lovable"; // openai, gemini, lovable
    
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
            { role: "user", content: exercisePrompt + "\n\nReturn ONLY a valid JSON object with the key 'exercises' containing an array of exactly 5 exercises." },
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
            parts: [{ text: systemPrompt + "\n\n" + exercisePrompt + "\n\nReturn ONLY a valid JSON object with the key 'exercises' containing an array of exactly 5 exercises." }]
          }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      });
    } else {
      // Lovable (original)
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: exercisePrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_exercises",
              description: "Return the generated exercises",
              parameters: {
                type: "object",
                properties: {
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["fill-blank", "translate", "match"] },
                        instruction: { type: "string" },
                        sentence: { type: "string" },
                        answer: { type: "string" },
                        hint: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        direction: { type: "string" },
                        pairs: { type: "array", items: { type: "object", properties: { english: { type: "string" }, portuguese: { type: "string" } }, required: ["english", "portuguese"] } },
                      },
                      required: ["type", "instruction"],
                    },
                  },
                },
                required: ["exercises"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_exercises" } },
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
    let exercises;

    // Parse response baseado no provider
    if (AI_PROVIDER === "openai") {
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in response");
      exercises = JSON.parse(content);
    } else if (AI_PROVIDER === "gemini") {
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("No content in response");
      exercises = JSON.parse(content);
    } else {
      // Lovable (original)
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call response");
      exercises = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify(exercises), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-practice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
