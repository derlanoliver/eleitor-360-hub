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

    const searchTerms = [
      entity.nome,
      ...(entity.palavras_chave || []),
      ...(entity.hashtags || []).map((h: string) => h.startsWith("#") ? h : `#${h}`),
    ];

    const searchQuery = query || searchTerms.join(" OR ");
    const targetSources = sources || ["news", "twitter", "instagram"];

    console.log(`Collecting mentions for "${entity.nome}" with query: ${searchQuery}`);
    console.log(`Target sources: ${targetSources.join(", ")}`);
    console.log(`API keys present - Zenscrape: ${!!ZENSCRAPE_API_KEY}, Datastream: ${!!DATASTREAM_API_KEY}`);

    const collectedMentions: any[] = [];

    // 1. Zenscrape - Web scraping for news sites
    if (targetSources.includes("news") && ZENSCRAPE_API_KEY) {
      try {
        const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws&tbs=qdr:d`;
        console.log(`Zenscrape: fetching ${url}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const zenscrapeRes = await fetch(
          `https://app.zenscrape.com/api/v1/get?url=${encodeURIComponent(url)}&render=false`,
          {
            headers: { "apikey": ZENSCRAPE_API_KEY },
            signal: controller.signal,
          }
        ).catch(e => {
          console.error("Zenscrape fetch error:", e.message);
          return null;
        });

        clearTimeout(timeout);

        if (zenscrapeRes?.ok) {
          const html = await zenscrapeRes.text();
          console.log(`Zenscrape: received ${html.length} chars`);
          const extracted = extractMentionsFromHTML(html, entity.nome, "news", entity_id);
          collectedMentions.push(...extracted);
          console.log(`Zenscrape: extracted ${extracted.length} mentions`);
        } else if (zenscrapeRes) {
          console.error("Zenscrape error:", zenscrapeRes.status);
        }
      } catch (e) {
        console.error("Zenscrape collection error:", e);
      }
    }

    // 2. Datastream - Social media monitoring
    if (DATASTREAM_API_KEY && targetSources.some((s: string) => ["twitter", "instagram", "facebook"].includes(s))) {
      try {
        console.log("Datastream: searching social mentions...");

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const datastreamRes = await fetch(
          "https://api.datastreamer.io/v1/search",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${DATASTREAM_API_KEY}`,
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
          }
        ).catch(e => {
          console.error("Datastream fetch error:", e.message);
          return null;
        });

        clearTimeout(timeout);

        if (datastreamRes?.ok) {
          const datastreamData = await datastreamRes.json();
          console.log(`Datastream: received ${datastreamData.results?.length || 0} results`);
          if (datastreamData.results) {
            for (const result of datastreamData.results) {
              collectedMentions.push({
                entity_id,
                source: result.source || "social",
                source_url: result.url || null,
                author_name: result.author?.name || result.author_name || null,
                author_handle: result.author?.handle || result.author_handle || null,
                content: (result.text || result.content || "").substring(0, 2000),
                published_at: result.published_at || result.date || new Date().toISOString(),
                engagement: {
                  likes: result.likes || 0,
                  shares: result.shares || result.retweets || 0,
                  comments: result.comments || result.replies || 0,
                  views: result.views || 0,
                },
                hashtags: result.hashtags || [],
                media_urls: result.media || [],
                raw_data: result,
              });
            }
          }
        } else if (datastreamRes) {
          const errText = await datastreamRes.text();
          console.error("Datastream error:", datastreamRes.status, errText);
        }
      } catch (e) {
        console.error("Datastream collection error:", e);
      }
    }

    console.log(`Total collected mentions: ${collectedMentions.length}`);

    // Save collected mentions to database
    if (collectedMentions.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("po_mentions")
        .insert(collectedMentions)
        .select("id");

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      // Trigger sentiment analysis in background (fire and forget)
      const mentionIds = inserted?.map(m => m.id) || [];
      if (mentionIds.length > 0) {
        const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-sentiment`;
        fetch(analyzeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ mention_ids: mentionIds, entity_id }),
        }).catch(err => console.error("Background analysis error:", err));
      }

      return new Response(JSON.stringify({
        success: true,
        collected: inserted?.length || 0,
        sources_queried: targetSources,
        analysis_triggered: mentionIds.length > 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      collected: 0,
      message: "Nenhuma menção encontrada para os termos de busca.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("po-collect-mentions error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractMentionsFromHTML(html: string, entityName: string, source: string, entityId: string): any[] {
  const mentions: any[] = [];
  const textBlocks = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 30 && line.toLowerCase().includes(entityName.toLowerCase()));

  const seen = new Set<string>();
  for (const block of textBlocks.slice(0, 20)) {
    const key = block.substring(0, 100);
    if (seen.has(key)) continue;
    seen.add(key);
    mentions.push({
      entity_id: entityId,
      source,
      source_url: null,
      author_name: null,
      author_handle: null,
      content: block.substring(0, 2000),
      published_at: new Date().toISOString(),
      engagement: {},
      hashtags: [],
      media_urls: [],
      raw_data: { extracted_from: "zenscrape" },
    });
  }
  return mentions;
}
