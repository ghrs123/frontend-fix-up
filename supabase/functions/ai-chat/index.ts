import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required and must not be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const systemMessage = {
      role: "system",
      content: `You are a friendly and patient English language tutor for Portuguese-speaking students. Your role is to:

1. Help students practice English conversation
2. Correct grammar and vocabulary mistakes gently
3. Explain grammar rules when asked
4. Provide example sentences and translations
5. Adapt to the student's level (beginner, intermediate, advanced)
6. Always provide Portuguese translations for new or difficult words
7. Use encouraging language

When correcting mistakes:
- Show the correct form
- Briefly explain why
- Give a similar example

Keep responses concise but helpful. Mix English with Portuguese explanations when needed.
Format responses using markdown for clarity.`,
    };

    // Configuração de IA - Suporta múltiplas APIs
    const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "gemini"; // openai, gemini, lovable
    
    if (AI_PROVIDER === "openai") {
      // OpenAI (ChatGPT) - Streaming nativo
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [systemMessage, ...messages],
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em breve." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos AI esgotados." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("OpenAI error:", response.status, errText);
        return new Response(JSON.stringify({ error: "Erro no serviço de IA", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });

    } else if (AI_PROVIDER === "gemini") {
      // Google Gemini - Conversão para SSE
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: systemMessage.content }] },
            ...messages.map((msg: any) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }]
            }))
          ],
          systemInstruction: { parts: [{ text: systemMessage.content }] },
          contents: messages.map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          })),
          generationConfig: {
            temperature: 0.7,
          },
        }),
      });

      if (!geminiResponse.ok) {
        if (geminiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em breve." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await geminiResponse.text();
        console.error("Gemini error:", geminiResponse.status, errText);
        return new Response(JSON.stringify({ error: "Erro no serviço de IA", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const geminiData = await geminiResponse.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Converter para formato de streaming SSE
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });

    } else {
      // Lovable (original) - Streaming nativo
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-1.5-flash",
          messages: [systemMessage, ...messages],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em breve." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos AI esgotados. Adiciona créditos na tua conta." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("Lovable error:", response.status, errText);
        return new Response(JSON.stringify({ error: "Erro no serviço de IA", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
