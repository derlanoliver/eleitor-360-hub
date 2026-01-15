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

    // Try primary endpoint first
    // SMSBarato API documentation: https://www.smsbarato.com.br/api-envio-sms
    // Try alternative domain patterns that SMS providers commonly use
    const endpoints = [
      `https://api.smsbarato.com.br/v1/saldo?chave=${apiKey}`,
      `https://smsbarato.com.br/api/consulta_saldo.php?chave=${apiKey}`,
      `https://www.smsbarato.com.br/api/consulta_saldo.php?chave=${apiKey}`,
    ];

    let lastError = "";
    let lastResponse = "";

    for (const endpoint of endpoints) {
      try {
        console.log(`[test-smsbarato-connection] Trying endpoint: ${endpoint.replace(apiKey, '***')}`);
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Accept": "application/json, text/plain, */*",
          },
        });
        
        const result = await response.text();
        lastResponse = result;
        
        console.log(`[test-smsbarato-connection] Response status: ${response.status}`);
        console.log(`[test-smsbarato-connection] Response: ${result.substring(0, 200)}`);

        // Check if response is HTML (404 page)
        if (result.includes("<!DOCTYPE html>") || result.includes("<html>")) {
          lastError = "Endpoint retornou página HTML (possível 404)";
          continue;
        }

        // Try to parse as JSON first
        try {
          const jsonResult = JSON.parse(result);
          if (jsonResult.saldo !== undefined || jsonResult.balance !== undefined || jsonResult.creditos !== undefined) {
            const balance = jsonResult.saldo ?? jsonResult.balance ?? jsonResult.creditos;
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
          }
          if (jsonResult.erro || jsonResult.error) {
            lastError = jsonResult.erro || jsonResult.error;
            continue;
          }
        } catch {
          // Not JSON, try as plain number (legacy format)
        }

        // SMSBarato legacy format returns a numeric value (balance) on success
        const balance = parseFloat(result.trim());
        
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
        }

        // Check for known error patterns
        if (result.toLowerCase().includes("erro") || result.toLowerCase().includes("invalida") || result.toLowerCase().includes("invalid")) {
          lastError = result.trim() || "API Key inválida";
          continue;
        }

        lastError = `Resposta inesperada: ${result.substring(0, 100)}`;
      } catch (fetchError) {
        console.error(`[test-smsbarato-connection] Fetch error for ${endpoint}:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError.message : "Erro de conexão";
      }
    }

    // All endpoints failed
    console.error("[test-smsbarato-connection] All endpoints failed. Last error:", lastError);
    console.error("[test-smsbarato-connection] Last response:", lastResponse.substring(0, 500));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: lastError || "Não foi possível conectar à API SMSBarato. O serviço pode estar indisponível ou a API Key é inválida.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[test-smsbarato-connection] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
