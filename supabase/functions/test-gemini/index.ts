import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      env_check: {},
      api_test: {},
    };

    // 1. Verificar variáveis de ambiente
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const AI_PROVIDER = Deno.env.get("AI_PROVIDER");
    
    diagnostics.env_check = {
      GEMINI_API_KEY_exists: !!GEMINI_API_KEY,
      GEMINI_API_KEY_length: GEMINI_API_KEY?.length || 0,
      GEMINI_API_KEY_prefix: GEMINI_API_KEY?.substring(0, 10) || "NOT_SET",
      AI_PROVIDER: AI_PROVIDER || "not_set (defaults to gemini)",
    };

    // 2. Testar chamada à API Gemini
    if (GEMINI_API_KEY) {
      try {
        const testResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say 'test successful' in Portuguese" }] }],
            }),
          }
        );

        diagnostics.api_test = {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText,
        };

        if (testResponse.ok) {
          const data = await testResponse.json();
          diagnostics.api_test.response = data.candidates?.[0]?.content?.parts?.[0]?.text || "No text";
          diagnostics.api_test.success = true;
        } else {
          const errorText = await testResponse.text();
          diagnostics.api_test.error = errorText;
          diagnostics.api_test.success = false;
        }
      } catch (apiError: any) {
        diagnostics.api_test = {
          success: false,
          error: apiError.message,
          stack: apiError.stack,
        };
      }
    } else {
      diagnostics.api_test = {
        success: false,
        error: "GEMINI_API_KEY not configured",
      };
    }

    // 3. Verificar endpoint correto
    diagnostics.endpoint_info = {
      correct_endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      note: "Using v1 (not v1beta) for gemini-1.5-flash model",
    };

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        error: e.message,
        stack: e.stack,
      }, null, 2),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
