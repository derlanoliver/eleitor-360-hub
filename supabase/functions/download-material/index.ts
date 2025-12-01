import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const funnelId = url.searchParams.get('funnel_id');
    
    if (!funnelId) {
      return new Response(JSON.stringify({ error: "funnel_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing download for funnel: ${funnelId}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Increment download count
    const { error: rpcError } = await supabase.rpc('increment_funnel_metric', {
      _funnel_id: funnelId,
      _metric: 'downloads'
    });

    if (rpcError) {
      console.error("Error incrementing metric:", rpcError);
    }

    // Get funnel to retrieve the file URL
    const { data: funnel, error: funnelError } = await supabase
      .from('lead_funnels')
      .select('lead_magnet_url')
      .eq('id', funnelId)
      .single();

    if (funnelError || !funnel) {
      console.error("Error fetching funnel:", funnelError);
      return new Response(JSON.stringify({ error: "Funnel not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Redirect to the actual file
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': funnel.lead_magnet_url,
      },
    });

  } catch (error) {
    console.error("Error in download-material:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});