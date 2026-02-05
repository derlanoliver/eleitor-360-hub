import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API Key é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing Resend connection...');
    
    // Test the API key by making a request to the Resend API
    // We'll try to get API keys info (lightweight endpoint)
    const response = await fetch('https://api.resend.com/api-keys', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Check if it's a permission error (key is valid but restricted)
      if (response.status === 403 || (data.message && data.message.includes('restricted'))) {
        console.log('Resend API key is valid but restricted - connection successful');
        return new Response(
          JSON.stringify({ 
            success: true, 
            connected: true,
            message: 'API Key válida (restrita para envio de emails)'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Resend API error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || 'API Key inválida',
          connected: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resend connection successful');

    return new Response(
      JSON.stringify({ 
        success: true, 
        connected: true,
        message: 'Conexão com Resend estabelecida com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error testing Resend connection:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Erro desconhecido',
        connected: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
