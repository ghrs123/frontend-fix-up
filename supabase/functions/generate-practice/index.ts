import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiGenerate } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace(/^Bearer /, "").trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Token JWT ausente ou inválido." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { exerciseType = "mixed", difficulty = "beginner" } = await req.json();

    const { data: flashcards, error: fcError } = await supabaseClient
      .from("flashcards")
      .select("word, translation, definition, example_sentence")
      .eq("is_active", true)
      .limit(30);

    if (fcError) {
      console.error("Flashcards error:", fcError);
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
      exercisePrompt = `Generate 5 fill-in-the-blank exercises. Each exercise: {"type":"fill-blank","instruction":"...","sentence":"... ___ ...","answer":"...","hint":"...","options":["...","...","...","..."]}`;
    } else if (exerciseType === "translate") {
      exercisePrompt = `Generate 5 translation exercises. Each exercise: {"type":"translate","instruction":"...","sentence":"...","answer":"...","direction":"en-pt"|"pt-en"}`;
    } else if (exerciseType === "match") {
      exercisePrompt = `Generate 5 matching exercises. Each exercise: {"type":"match","instruction":"...","pairs":[{"english":"...","portuguese":"..."},...]]}`;
    } else {
      exercisePrompt = `Generate 5 mixed exercises (2 fill-blank, 2 translate, 1 match). Use the formats above.`;
    }

    const fullPrompt = `${systemPrompt}\n\n${exercisePrompt}`;

    const raw = await geminiGenerate({
      user: fullPrompt,
      temperature: 0.7,
      responseMimeType: "application/json",
    });

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    if (!parsed?.exercises || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum exercício foi gerado.", details: parsed }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-practice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
