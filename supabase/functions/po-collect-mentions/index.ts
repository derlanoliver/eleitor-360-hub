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
    const DATASTREAM_PIPELINE_ID = Deno.env.get("DATASTREAM_PIPELINE_ID");
    const DATASTREAM_COMPONENT_ID = Deno.env.get("DATASTREAM_COMPONENT_ID");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { entity_id, sources, query, mode } = await req.json();
    if (!entity_id) throw new Error("entity_id is required");

    const { data: entity, error: entityError } = await supabase
      .from("po_monitored_entities")
      .select("*")
      .eq("id", entity_id)
      .single();

    if (entityError || !entity) throw new Error("Entity not found");

    const searchQuery = query || `"${entity.nome}"`;
    const targetSources = sources || ["news"];

    console.log(`Collecting for "${entity.nome}", query: ${searchQuery}, sources: ${targetSources.join(",")}, mode: ${mode || "collect"}`);

    const collectedMentions: any[] = [];

    // ── 1. Zenscrape - news scraping ──
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

    // ── 2. Datastream - social media via Jobs API + Search API ──
    const socialSources = targetSources.filter((s: string) => s !== "news");
    if (DATASTREAM_API_KEY && DATASTREAM_PIPELINE_ID && DATASTREAM_COMPONENT_ID && socialSources.length > 0) {
      const requestMode = mode || "collect";

      if (requestMode === "collect" || requestMode === "create_job") {
        // Step 1: Create a job on Datastreamer
        const jobResult = await createDatastreamJob(
          DATASTREAM_API_KEY,
          DATASTREAM_PIPELINE_ID,
          DATASTREAM_COMPONENT_ID,
          searchQuery,
          socialSources[0] // one job per data_source
        );

        if (jobResult.success) {
          console.log(`Datastream: job created - ${jobResult.job_id}`);

          // If mode is "collect", wait briefly and try to fetch results via Search API
          if (requestMode === "collect") {
            // Wait 5s for job to start processing
            await new Promise(resolve => setTimeout(resolve, 5000));

            const searchResults = await searchDatastream(
              DATASTREAM_API_KEY,
              searchQuery,
              socialSources,
              50
            );

            for (const r of searchResults) {
              collectedMentions.push({
                entity_id,
                source: r.data_source || r.source || "social",
                source_url: r.url || r.source_url || null,
                author_name: r.author?.name || r.author_name || null,
                author_handle: r.author?.screen_name || r.author?.handle || r.author_handle || null,
                content: (r.content?.body || r.text || r.content || "").substring(0, 2000),
                published_at: r.doc_date || r.published_at || new Date().toISOString(),
                engagement: {
                  likes: r.content?.likes || r.likes || 0,
                  shares: r.content?.shares || r.shares || 0,
                  comments: r.content?.comments || r.comments || 0,
                  views: r.content?.views || r.views || 0,
                },
                hashtags: r.content?.hashtags || r.hashtags || [],
                media_urls: r.content?.media || r.media || [],
                raw_data: { source: "datastream", job_id: jobResult.job_id, doc_id: r.id },
              });
            }
            console.log(`Datastream Search: ${searchResults.length} results`);
          }

          // Return job info so frontend can poll later if needed
          if (requestMode === "create_job" || collectedMentions.length === 0) {
            return new Response(JSON.stringify({
              success: true,
              collected: 0,
              job_created: true,
              job_id: jobResult.job_id,
              message: "Job criado no Datastream. Os dados estarão disponíveis em alguns minutos. Use mode='fetch_results' para buscar.",
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } else {
          console.error(`Datastream job creation failed: ${jobResult.error}`);
        }
      } else if (requestMode === "fetch_results") {
        // Step 2: Just fetch results from Search API (called after job completes)
        const searchResults = await searchDatastream(
          DATASTREAM_API_KEY,
          searchQuery,
          socialSources,
          50
        );

        for (const r of searchResults) {
          collectedMentions.push({
            entity_id,
            source: r.data_source || r.source || "social",
            source_url: r.url || r.source_url || null,
            author_name: r.author?.name || r.author_name || null,
            author_handle: r.author?.screen_name || r.author?.handle || r.author_handle || null,
            content: (r.content?.body || r.text || r.content || "").substring(0, 2000),
            published_at: r.doc_date || r.published_at || new Date().toISOString(),
            engagement: {
              likes: r.content?.likes || r.likes || 0,
              shares: r.content?.shares || r.shares || 0,
              comments: r.content?.comments || r.comments || 0,
              views: r.content?.views || r.views || 0,
            },
            hashtags: r.content?.hashtags || r.hashtags || [],
            media_urls: r.content?.media || r.media || [],
            raw_data: { source: "datastream", doc_id: r.id },
          });
        }
        console.log(`Datastream Search (fetch_results): ${searchResults.length} results`);
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

// ── Datastream: Create Job ──
async function createDatastreamJob(
  apiKey: string,
  pipelineId: string,
  componentId: string,
  query: string,
  dataSource: string
): Promise<{ success: boolean; job_id?: string; error?: string }> {
  try {
    const url = `https://api.platform.datastreamer.io/api/pipelines/${pipelineId}/components/${componentId}/jobs?ready=true`;
    console.log(`Datastream: creating job at ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_name: crypto.randomUUID(),
        query: { query },
        data_source: dataSource,
        job_type: "one_time",
        priority: "normal",
        max_documents: 100,
        job_state: "ready",
        state: "ready",
      }),
      signal: controller.signal,
    }).catch(e => {
      console.error("Datastream job fetch error:", e.message);
      return null;
    });

    clearTimeout(timeout);

    if (!res) return { success: false, error: "Network error" };

    const body = await res.text();
    console.log(`Datastream job response ${res.status}: ${body.substring(0, 300)}`);

    if (res.ok) {
      try {
        const data = JSON.parse(body);
        return { success: true, job_id: data.job_id || data.id || "unknown" };
      } catch {
        return { success: true, job_id: "created" };
      }
    }

    return { success: false, error: `${res.status}: ${body.substring(0, 200)}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ── Datastream: Search API ──
async function searchDatastream(
  apiKey: string,
  query: string,
  dataSources: string[],
  size: number
): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://api.platform.datastreamer.io/api/search", {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          from: 0,
          size,
          query,
          data_sources: dataSources,
        },
      }),
      signal: controller.signal,
    }).catch(e => {
      console.error("Datastream search error:", e.message);
      return null;
    });

    clearTimeout(timeout);

    if (!res) return [];

    if (res.ok) {
      const data = await res.json();
      console.log(`Datastream search: ${data.results?.length || 0} results`);
      return data.results || [];
    }

    const errBody = await res.text();
    console.error(`Datastream search error ${res.status}: ${errBody.substring(0, 200)}`);
    return [];
  } catch (e) {
    console.error("Datastream search error:", e);
    return [];
  }
}

// ── Zenscrape: HTML extraction ──
function extractMentionsFromHTML(html: string, entityName: string, source: string, entityId: string): any[] {
  const mentions: any[] = [];
  const nameLower = entityName.toLowerCase();

  const cleanText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");

  const nameCount = (cleanText.toLowerCase().match(new RegExp(nameLower.replace(/\s+/g, "\\s+"), "gi")) || []).length;
  if (nameCount === 0) return mentions;

  const regex = new RegExp(`([^.!?]*${nameLower.replace(/\s+/g, "\\s+")}[^.!?]*)`, "gi");
  const matches = cleanText.match(regex) || [];

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
