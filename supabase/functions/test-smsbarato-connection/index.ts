import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestSMSBaratoRequest {
  apiKey: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey }: TestSMSBaratoRequest = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "API Key é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[test-smsbarato-connection] Testing SMSBarato connection...");

    // Check balance to verify API key is valid
    // SMSBarato API: https://www.smsbarato.com.br/
    const response = await fetch(
      `https://www.smsbarato.com.br/api/consulta_saldo.php?chave=${apiKey}`
    );
    const result = await response.text();

    console.log("[test-smsbarato-connection] SMSBarato response:", result);

    // SMSBarato returns a numeric value (balance) on success or an error message
    const balance = parseFloat(result);
    
    if (!isNaN(balance) && balance >= 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            connected: true,
            balance: balance,
            description: `Saldo disponível: ${balance} SMS`,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Check for common error messages
      const errorMessage = result.includes("ERRO") || result.includes("invalida") 
        ? "API Key inválida" 
        : result || "Erro de conexão com SMSBarato";
        
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("[test-smsbarato-connection] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
