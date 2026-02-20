import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    console.log(`po-auto-collect: starting at ${now.toISOString()}`);

    // Get all active collection configs that are due
    const { data: configs, error: cfgError } = await supabase
      .from("po_collection_configs")
      .select("*, entity:po_monitored_entities(*)")
      .eq("is_active", true);

    if (cfgError) throw cfgError;
    if (!configs || configs.length === 0) {
      console.log("po-auto-collect: no active configs found");
      return new Response(JSON.stringify({ success: true, message: "No active configs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let triggered = 0;

    for (const config of configs) {
      // Check if it's time to run
      if (config.next_run_at && new Date(config.next_run_at) > now) {
        console.log(`po-auto-collect: skipping ${config.entity?.nome || config.entity_id} (next_run_at: ${config.next_run_at})`);
        continue;
      }

      const entity = config.entity;
      if (!entity) {
        console.log(`po-auto-collect: entity not found for config ${config.id}`);
        continue;
      }

      // Determine sources based on entity's configured social networks
      const sources: string[] = ["news", "google_news", "portais_df", "reddit"];
      const redes = entity.redes_sociais as Record<string, string> | null;
      if (redes?.twitter) sources.push("twitter_comments");
      if (redes?.instagram) sources.push("instagram_comments");
      if (redes?.facebook) sources.push("facebook_comments");
      if (redes?.tiktok) sources.push("tiktok_comments");
      if (redes?.youtube) sources.push("youtube_comments");
      if (redes?.telegram) sources.push("telegram");

      console.log(`po-auto-collect: triggering for "${entity.nome}" with sources: ${sources.join(",")}`);

      // Fire and forget - call po-collect-mentions in background
      fetch(`${supabaseUrl}/functions/v1/po-collect-mentions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          entity_id: entity.id,
          sources,
        }),
      }).catch(err => console.error(`po-auto-collect: error triggering for ${entity.nome}:`, err));

      // Update last_run_at and next_run_at
      const intervalMinutes = config.run_interval_minutes || 60;
      const nextRun = new Date(now.getTime() + intervalMinutes * 60 * 1000);

      await supabase
        .from("po_collection_configs")
        .update({
          last_run_at: now.toISOString(),
          next_run_at: nextRun.toISOString(),
          last_error: null,
          updated_at: now.toISOString(),
        })
        .eq("id", config.id);

      triggered++;
    }

    console.log(`po-auto-collect: triggered ${triggered} collections`);

    return new Response(JSON.stringify({
      success: true,
      triggered,
      total_configs: configs.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("po-auto-collect error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
