import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestMetaCloudRequest {
  phoneNumberId: string;
  apiVersion?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: "Acesso não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phoneNumberId, apiVersion = "v20.0" }: TestMetaCloudRequest = await req.json();

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone Number ID é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token from environment
    const accessToken = Deno.env.get("META_WA_ACCESS_TOKEN");
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "META_WA_ACCESS_TOKEN não está configurado nos secrets do ambiente" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[test-meta-cloud] Testing connection to Graph API ${apiVersion}/${phoneNumberId}`);

    // Test connection by getting phone number info
    const graphUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;
    
    const response = await fetch(graphUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[test-meta-cloud] Error:", data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error?.message || "Erro ao conectar com a Graph API",
          details: data.error
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[test-meta-cloud] Connection successful:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          phoneNumberId: data.id,
          displayPhoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
          qualityRating: data.quality_rating,
          platformType: data.platform_type,
          accountMode: data.account_mode,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[test-meta-cloud] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
