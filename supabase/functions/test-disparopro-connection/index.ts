import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestDisparoproRequest {
  usuario: string;
  senha: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { usuario, senha }: TestDisparoproRequest = await req.json();

    if (!usuario || !senha) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[test-disparopro-connection] Testing Disparopro connection...");

    // Check balance to verify credentials are valid using Disparopro's own endpoint
    const response = await fetch(
      `https://disparopro.com.br/api/consulta_saldo.php?usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}`
    );
    const result = await response.text();

    console.log("[test-disparopro-connection] Disparopro response:", result);

    // Disparopro returns a numeric value (balance) on success or an error message
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
      let errorMessage = "Erro de conexão com Disparopro";
      
      if (result.includes("900") || result.includes("ERRO") || result.includes("invalida")) {
        errorMessage = "Credenciais inválidas - verifique usuário e senha";
      }
        
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("[test-disparopro-connection] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
