import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    // Autenticação: repassar Authorization header inteiro
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { exerciseType = "mixed", difficulty = "beginner" } = await req.json();

    // Fetch user's flashcards (RLS garante que só busca do utilizador autenticado)
    const { data: flashcards, error: fcError } = await supabase
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

    // Gemini v1beta e modelo correto
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const aiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: `${exercisePrompt}\n\nReturn ONLY JSON.` }] },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
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

    const text = await aiResponse.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "AI returned invalid JSON", details: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed?.exercises || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum exercício foi gerado.", details: parsed }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-practice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
