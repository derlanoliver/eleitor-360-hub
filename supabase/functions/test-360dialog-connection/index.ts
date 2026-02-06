import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phoneNumberId } = await req.json();

    const apiKey = Deno.env.get("DIALOG360_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "DIALOG360_API_KEY não está configurado nos secrets" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone Number ID é obrigatório" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test connection by fetching phone number info from 360dialog
    const response = await fetch(`https://waba-v2.360dialog.io/${phoneNumberId}`, {
      method: "GET",
      headers: {
        "D360-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("[test-360dialog] Response:", JSON.stringify(data));

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error?.message || data.meta?.developer_message || `Erro HTTP ${response.status}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          displayPhoneNumber: data.display_phone_number || data.verified_name || phoneNumberId,
          verifiedName: data.verified_name,
          qualityRating: data.quality_rating,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[test-360dialog] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
