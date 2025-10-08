import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Suporta domain via query param ou body
    let domain: string | null = url.searchParams.get("domain");
    
    if (!domain && req.method === "POST") {
      const body = await req.json();
      domain = body.domain;
    }
    
    // Fallback para headers do request
    if (!domain) {
      domain = req.headers.get("x-forwarded-host") || req.headers.get("host");
    }

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain parameter required" }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[tenant-config] Looking up tenant for domain: ${domain}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar tenant pelo domínio
    const { data: domainRow, error: dErr } = await supabase
      .from("tenant_domains")
      .select("tenant_id")
      .eq("domain", domain)
      .maybeSingle();

    if (dErr) {
      console.error(`[tenant-config] Error finding domain:`, dErr);
      return new Response(
        JSON.stringify({ error: "Database error", details: dErr.message }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!domainRow) {
      console.log(`[tenant-config] No tenant found for domain: ${domain}`);
      return new Response(
        JSON.stringify({ error: "Tenant not found for domain", domain }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar tenant com branding e settings
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select(`
        id, name, slug, status, created_at, updated_at,
        tenant_branding(*),
        tenant_settings(*)
      `)
      .eq("id", domainRow.tenant_id)
      .maybeSingle();

    if (tErr) {
      console.error(`[tenant-config] Error fetching tenant:`, tErr);
      return new Response(
        JSON.stringify({ error: "Error fetching tenant", details: tErr.message }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!tenant) {
      console.log(`[tenant-config] Tenant not found for ID: ${domainRow.tenant_id}`);
      return new Response(
        JSON.stringify({ error: "Tenant not found" }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[tenant-config] Successfully found tenant: ${tenant.slug}`);

    return new Response(JSON.stringify(tenant), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[tenant-config] Unexpected error:`, e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
