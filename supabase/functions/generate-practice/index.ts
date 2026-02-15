import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autenticado. Por favor, faz login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace(/^Bearer /, "").trim();
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: "Token JWT ausente ou inválido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { exerciseType = "mixed", difficulty = "beginner" } = await req.json();

    const { data: flashcards, error: fcError } = await supabaseClient
      .from("flashcards")
      .select("word, translation, definition, example_sentence")
      .eq("is_active", true)
      .limit(30);

    if (fcError) {
      console.error("Flashcards error:", fcError);
      if (fcError.message?.includes("JWT")) {
        return new Response(
          JSON.stringify({ error: "Não autenticado. Por favor, faz login novamente." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fcError;
    }

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

    const fullPrompt = systemPrompt + "\n\n" + exercisePrompt + "\n\nReturn ONLY a valid JSON object with the key 'exercises' containing an array of exactly 5 exercises.";

    // Use Lovable AI Gateway with Gemini model
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: fullPrompt },
        ],
        tools: [
          {
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
                        pairs: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              english: { type: "string" },
                              portuguese: { type: "string" },
                            },
                            required: ["english", "portuguese"],
                          },
                        },
                      },
                      required: ["type", "instruction"],
                    },
                  },
                },
                required: ["exercises"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_exercises" } },
      }),
    });

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
      return new Response(JSON.stringify({ error: "Erro no serviço de IA", details: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    
    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let exercises;
    if (toolCall) {
      exercises = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try content
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in AI response");
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      exercises = JSON.parse(cleaned);
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
