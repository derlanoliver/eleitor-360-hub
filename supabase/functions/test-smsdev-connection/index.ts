import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestSMSDEVRequest {
  apiKey: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey }: TestSMSDEVRequest = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "API Key é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[test-smsdev-connection] Testing SMSDEV connection...");

    // Check balance to verify API key is valid
    const response = await fetch(`https://api.smsdev.com.br/v1/balance?key=${apiKey}`);
    const result = await response.json();

    console.log("[test-smsdev-connection] SMSDEV response:", result);

    if (result.situacao === "OK") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            connected: true,
            balance: result.saldo_sms,
            description: `Saldo disponível: ${result.saldo_sms} SMS`,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.descricao || "API Key inválida ou erro de conexão",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("[test-smsdev-connection] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
