import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ZENSCRAPE_API_KEY = Deno.env.get("ZENSCRAPE_API_KEY");
    const DATASTREAM_API_KEY = Deno.env.get("DATASTREAM_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { entity_id, sources, query } = await req.json();
    if (!entity_id) throw new Error("entity_id is required");

    const { data: entity, error: entityError } = await supabase
      .from("po_monitored_entities")
      .select("*")
      .eq("id", entity_id)
      .single();

    if (entityError || !entity) throw new Error("Entity not found");

    // Keep query simple to avoid API errors
    const searchQuery = query || `"${entity.nome}"`;
    const targetSources = sources || ["news"];

    console.log(`Collecting for "${entity.nome}", query: ${searchQuery}, sources: ${targetSources.join(",")}`);
    console.log(`Keys: Zenscrape=${!!ZENSCRAPE_API_KEY}, Datastream=${!!DATASTREAM_API_KEY}`);

    const collectedMentions: any[] = [];

    // 1. Zenscrape - news scraping
    if (targetSources.includes("news") && ZENSCRAPE_API_KEY) {
      const urls = [
        `https://www.bing.com/news/search?q=${encodeURIComponent(searchQuery)}&setlang=pt-br`,
        `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}&vt=news`,
      ];

      for (const targetUrl of urls) {
        try {
          const zenscrapeUrl = `https://app.zenscrape.com/api/v1/get?url=${encodeURIComponent(targetUrl)}`;
          console.log(`Zenscrape: fetching ${targetUrl}`);

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000);

          const res = await fetch(zenscrapeUrl, {
            headers: { "apikey": ZENSCRAPE_API_KEY },
            signal: controller.signal,
          }).catch(e => {
            console.error("Zenscrape fetch error:", e.message);
            return null;
          });

          clearTimeout(timeout);

          if (res?.ok) {
            const html = await res.text();
            console.log(`Zenscrape: received ${html.length} chars`);
            const extracted = extractMentionsFromHTML(html, entity.nome, "news", entity_id);
            collectedMentions.push(...extracted);
            console.log(`Zenscrape: extracted ${extracted.length} mentions`);
          } else if (res) {
            const errBody = await res.text();
            console.error(`Zenscrape error ${res.status}: ${errBody.substring(0, 200)}`);
          }
        } catch (e) {
          console.error("Zenscrape error:", e);
        }
      }
    }

    // 2. Datastream - social media
    if (DATASTREAM_API_KEY && targetSources.some((s: string) => ["twitter", "instagram", "facebook"].includes(s))) {
      try {
        console.log("Datastream: searching...");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch("https://api.platform.datastreamer.io/api/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${DATASTREAM_API_KEY}`,
            "x-api-key": DATASTREAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            sources: targetSources.filter((s: string) => s !== "news"),
            limit: 50,
            language: "pt",
            sort: "date",
          }),
          signal: controller.signal,
        }).catch(e => {
          console.error("Datastream fetch error:", e.message);
          return null;
        });

        clearTimeout(timeout);

        if (res?.ok) {
          const data = await res.json();
          console.log(`Datastream: ${data.results?.length || 0} results`);
          for (const r of (data.results || [])) {
            collectedMentions.push({
              entity_id,
              source: r.source || "social",
              source_url: r.url || null,
              author_name: r.author?.name || r.author_name || null,
              author_handle: r.author?.handle || r.author_handle || null,
              content: (r.text || r.content || "").substring(0, 2000),
              published_at: r.published_at || r.date || new Date().toISOString(),
              engagement: { likes: r.likes || 0, shares: r.shares || 0, comments: r.comments || 0, views: r.views || 0 },
              hashtags: r.hashtags || [],
              media_urls: r.media || [],
              raw_data: r,
            });
          }
        } else if (res) {
          console.error(`Datastream error ${res.status}: ${(await res.text()).substring(0, 200)}`);
        }
      } catch (e) {
        console.error("Datastream error:", e);
      }
    }

    console.log(`Total collected: ${collectedMentions.length}`);

    if (collectedMentions.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("po_mentions")
        .insert(collectedMentions)
        .select("id");

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      const mentionIds = inserted?.map(m => m.id) || [];
      if (mentionIds.length > 0) {
        fetch(`${supabaseUrl}/functions/v1/analyze-sentiment`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ mention_ids: mentionIds, entity_id }),
        }).catch(err => console.error("Background analysis error:", err));
      }

      return new Response(JSON.stringify({
        success: true, collected: inserted?.length || 0, sources_queried: targetSources, analysis_triggered: mentionIds.length > 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true, collected: 0, message: "Nenhuma menção encontrada.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("po-collect-mentions error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function extractMentionsFromHTML(html: string, entityName: string, source: string, entityId: string): any[] {
  const mentions: any[] = [];
  const nameLower = entityName.toLowerCase();
  const nameWords = nameLower.split(/\s+/);

  // Clean HTML
  const cleanText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");

  console.log(`extractMentions: clean text length ${cleanText.length}, searching for "${entityName}"`);

  // Check if name appears at all
  const nameCount = (cleanText.toLowerCase().match(new RegExp(nameLower.replace(/\s+/g, "\\s+"), "gi")) || []).length;
  console.log(`extractMentions: found "${entityName}" ${nameCount} times in text`);

  if (nameCount === 0) return mentions;

  // Split into sentences/paragraphs around the entity name
  const regex = new RegExp(`([^.!?]*${nameLower.replace(/\s+/g, "\\s+")}[^.!?]*)`, "gi");
  const matches = cleanText.match(regex) || [];

  console.log(`extractMentions: ${matches.length} sentence matches`);

  const seen = new Set<string>();
  for (const match of matches.slice(0, 30)) {
    const trimmed = match.trim();
    if (trimmed.length < 15) continue;
    const key = trimmed.substring(0, 80).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    mentions.push({
      entity_id: entityId,
      source,
      source_url: null,
      author_name: null,
      author_handle: null,
      content: trimmed.substring(0, 2000),
      published_at: new Date().toISOString(),
      engagement: {},
      hashtags: [],
      media_urls: [],
      raw_data: { extracted_from: "zenscrape" },
    });
  }
  return mentions;
}
