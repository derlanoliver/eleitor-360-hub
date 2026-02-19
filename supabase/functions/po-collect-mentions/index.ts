import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APIFY_BASE = "https://api.apify.com/v2";

// Map source names to Apify actor IDs
const APIFY_ACTORS: Record<string, string> = {
  twitter: "desearch~ai-twitter-search",
  instagram: "apify~instagram-scraper",
  instagram_comments: "apify~instagram-comment-scraper",
  facebook: "tropical_quince~facebook-page-scraper",
  facebook_posts: "apify~facebook-posts-scraper",
  facebook_comments: "apify~facebook-comments-scraper",
  google_news: "dlaf~google-news-free",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    const ZENSCRAPE_API_KEY = Deno.env.get("ZENSCRAPE_API_KEY");

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

    const searchQuery = query || `"${entity.nome}"`;
    const targetSources = sources || ["news"];

    console.log(`Collecting for "${entity.nome}", query: ${searchQuery}, sources: ${targetSources.join(",")}`);

    const collectedMentions: any[] = [];

    // ── 1. Zenscrape - news scraping (Bing + Yahoo) ──
    if (targetSources.includes("news") && ZENSCRAPE_API_KEY) {
      const mentions = await collectViaZenscrape(ZENSCRAPE_API_KEY, searchQuery, entity.nome, entity_id);
      collectedMentions.push(...mentions);
    }

    // ── 2. Apify - Google News ──
    if (targetSources.includes("google_news") && APIFY_API_TOKEN) {
      const mentions = await collectGoogleNews(APIFY_API_TOKEN, searchQuery, entity.nome, entity_id);
      collectedMentions.push(...mentions);
    }

    // ── 3. Apify - Twitter/X ──
    if (targetSources.includes("twitter") && APIFY_API_TOKEN) {
      const mentions = await collectTwitter(APIFY_API_TOKEN, searchQuery, entity.nome, entity_id);
      collectedMentions.push(...mentions);
    }

    // ── 4. Apify - Instagram ──
    if (targetSources.includes("instagram") && APIFY_API_TOKEN) {
      const mentions = await collectInstagram(APIFY_API_TOKEN, searchQuery, entity.nome, entity_id);
      collectedMentions.push(...mentions);
    }

    // ── 5. Apify - Facebook ──
    if (targetSources.includes("facebook") && APIFY_API_TOKEN) {
      const mentions = await collectFacebook(APIFY_API_TOKEN, searchQuery, entity.nome, entity_id);
      collectedMentions.push(...mentions);
    }

    // ── 6. Facebook Comments (from entity's own page) ──
    if (targetSources.includes("facebook_comments") && APIFY_API_TOKEN) {
      const fbHandle = entity.redes_sociais?.facebook;
      if (fbHandle) {
        const mentions = await collectFacebookComments(APIFY_API_TOKEN, fbHandle, entity.nome, entity_id);
        collectedMentions.push(...mentions);
      } else {
        console.log("facebook_comments: no Facebook handle configured for entity");
      }
    }

    // ── 7. Instagram Comments (from entity's own profile) ──
    if (targetSources.includes("instagram_comments") && APIFY_API_TOKEN) {
      const igHandle = entity.redes_sociais?.instagram;
      if (igHandle) {
        const mentions = await collectInstagramComments(APIFY_API_TOKEN, igHandle, entity.nome, entity_id);
        collectedMentions.push(...mentions);
      } else {
        console.log("instagram_comments: no Instagram handle configured for entity");
      }
    }

    // ── 8. Twitter Replies (from entity's own profile) ──
    if (targetSources.includes("twitter_comments") && APIFY_API_TOKEN) {
      const twHandle = entity.redes_sociais?.twitter;
      if (twHandle) {
        const mentions = await collectTwitterReplies(APIFY_API_TOKEN, twHandle, entity.nome, entity_id);
        collectedMentions.push(...mentions);
      } else {
        console.log("twitter_comments: no Twitter handle configured for entity");
      }
    }


    // ── Dedupe: remove mentions whose content already exists in DB ──
    if (collectedMentions.length > 0) {
      const { data: existing } = await supabase
        .from("po_mentions")
        .select("content")
        .eq("entity_id", entity_id)
        .order("created_at", { ascending: false })
        .limit(500);

      const existingSet = new Set(
        (existing || []).map((e: any) => e.content.substring(0, 200))
      );

      const uniqueMentions = collectedMentions.filter(
        m => !existingSet.has(m.content.substring(0, 200))
      );

      const dupeCount = collectedMentions.length - uniqueMentions.length;
      console.log(`Dedupe: ${dupeCount} duplicates removed, ${uniqueMentions.length} unique`);

      if (uniqueMentions.length === 0) {
        return new Response(JSON.stringify({
          success: true, collected: 0, duplicates_removed: dupeCount,
          message: "Todas as menções já existiam no banco.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: inserted, error: insertError } = await supabase
        .from("po_mentions")
        .insert(uniqueMentions)
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
        success: true, collected: inserted?.length || 0, duplicates_removed: dupeCount,
        sources_queried: targetSources, analysis_triggered: mentionIds.length > 0,
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

// ══════════════════════════════════════════════════
// APIFY HELPERS
// ══════════════════════════════════════════════════

async function runApifyActor(token: string, actorId: string, input: Record<string, any>, timeoutSecs = 120): Promise<any[]> {
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSecs}&format=json`;
  console.log(`Apify: running ${actorId}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (timeoutSecs + 30) * 1000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Apify ${actorId} error ${res.status}: ${errBody.substring(0, 300)}`);
      return [];
    }

    const data = await res.json();
    console.log(`Apify ${actorId}: received ${Array.isArray(data) ? data.length : 0} items`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    clearTimeout(timeout);
    console.error(`Apify ${actorId} error:`, e instanceof Error ? e.message : e);
    return [];
  }
}

// ── Google News via Apify ──
async function collectGoogleNews(token: string, query: string, entityName: string, entityId: string): Promise<any[]> {
  const searchTerm = query.replace(/"/g, "");
  const items = await runApifyActor(token, APIFY_ACTORS.google_news, {
    query: searchTerm,
    language: "pt",
    region: "BR",
    maxArticles: 30,
    timeRange: "7d",
    mode: "lightweight",
    deduplication: true,
  });

  return items.map(item => ({
    entity_id: entityId,
    source: "google_news",
    source_url: item.link || item.url || null,
    author_name: item.source || item.publisher || null,
    author_handle: null,
    content: (item.title ? `${item.title}. ${item.snippet || item.description || ""}` : item.snippet || item.description || "").substring(0, 2000),
    published_at: item.publishedAt || item.date || item.published_date || new Date().toISOString(),
    engagement: {},
    hashtags: [],
    media_urls: item.image ? [item.image] : [],
    raw_data: { source: "apify_google_news" },
  })).filter(m => m.content.length > 10);
}

// ── Twitter/X via Apify ──
async function collectTwitter(token: string, query: string, entityName: string, entityId: string): Promise<any[]> {
  const searchTerm = query.replace(/"/g, "");
  const items = await runApifyActor(token, APIFY_ACTORS.twitter, {
    query: searchTerm,
    lang: "pt",
    min_likes: 0,
  });

  return items.map(item => ({
    entity_id: entityId,
    source: "twitter",
    source_url: item.url || item.tweet_url || null,
    author_name: item.author_name || item.user_name || item.name || null,
    author_handle: item.author_handle || item.screen_name || item.username || null,
    content: (item.text || item.full_text || item.content || "").substring(0, 2000),
    published_at: item.created_at || item.date || new Date().toISOString(),
    engagement: {
      likes: item.like_count || item.likes || item.favorite_count || 0,
      shares: item.retweet_count || item.retweets || 0,
      comments: item.reply_count || item.replies || 0,
      views: item.view_count || item.views || 0,
    },
    hashtags: item.hashtags || [],
    media_urls: item.media?.map((m: any) => m.url || m) || [],
    raw_data: { source: "apify_twitter" },
  })).filter(m => m.content.length > 5);
}

// ── Instagram via Apify ──
async function collectInstagram(token: string, query: string, entityName: string, entityId: string): Promise<any[]> {
  const searchTerm = query.replace(/"/g, "");
  const items = await runApifyActor(token, APIFY_ACTORS.instagram, {
    search: searchTerm,
    searchType: "hashtag",
    resultsLimit: 30,
  });

  return items.map(item => ({
    entity_id: entityId,
    source: "instagram",
    source_url: item.url || item.postUrl || null,
    author_name: item.ownerFullName || item.owner?.fullName || null,
    author_handle: item.ownerUsername || item.owner?.username || null,
    content: (item.caption || item.text || item.alt || "").substring(0, 2000),
    published_at: item.timestamp || item.takenAtTimestamp ? new Date((item.takenAtTimestamp || 0) * 1000).toISOString() : new Date().toISOString(),
    engagement: {
      likes: item.likesCount || item.likes || 0,
      comments: item.commentsCount || item.comments || 0,
      views: item.videoViewCount || item.views || 0,
      shares: 0,
    },
    hashtags: item.hashtags || [],
    media_urls: item.displayUrl ? [item.displayUrl] : item.images || [],
    raw_data: { source: "apify_instagram", apify_id: item.id },
  })).filter(m => m.content.length > 5);
}

// ══════════════════════════════════════════════════
// INSTAGRAM COMMENTS (from entity's own profile)
// Two-stage: fetch posts → extract comments
// ══════════════════════════════════════════════════

async function collectInstagramComments(token: string, igHandle: string, entityName: string, entityId: string): Promise<any[]> {
  const handle = igHandle.replace(/^@/, "");
  const profileUrl = `https://www.instagram.com/${handle}`;
  console.log(`Instagram Comments: Stage 1 - fetching posts from ${profileUrl}`);

  // Stage 1: Get recent posts from the profile
  const posts = await runApifyActor(token, APIFY_ACTORS.instagram, {
    directUrls: [profileUrl],
    resultsType: "posts",
    resultsLimit: 10,
  }, 40);

  if (!posts.length) {
    console.log("Instagram Comments: no posts found");
    return [];
  }

  const postUrls = posts
    .map(p => p.url || p.postUrl || (p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : null))
    .filter(Boolean)
    .slice(0, 10);

  console.log(`Instagram Comments: Stage 1 got ${posts.length} posts, ${postUrls.length} URLs`);

  if (postUrls.length === 0) return [];

  // Stage 2: Get comments from those posts
  console.log(`Instagram Comments: Stage 2 - fetching comments from ${postUrls.length} posts`);
  const commentItems = await runApifyActor(token, APIFY_ACTORS.instagram_comments, {
    directUrls: postUrls,
    maxComments: 100,
    maxReplies: 0,
  }, 90);

  console.log(`Instagram Comments: Stage 2 got ${commentItems.length} comment items`);
  if (commentItems.length > 0) {
    console.log(`Instagram Comments: comment keys: ${Object.keys(commentItems[0]).join(", ")}`);
    console.log(`Instagram Comments: sample: ${JSON.stringify(commentItems[0]).substring(0, 500)}`);
  }

  const mentions: any[] = [];

  for (const comment of commentItems) {
    const content = (comment.text || comment.comment || comment.body || comment.message || "").substring(0, 2000);
    if (content.length < 3) continue;

    const postUrl = comment.postUrl || comment.inputUrl || null;
    mentions.push({
      entity_id: entityId,
      source: "instagram_comments",
      source_url: postUrl,
      author_name: comment.ownerFullName || comment.fullName || comment.userFullName || null,
      author_handle: comment.ownerUsername || comment.username || null,
      content,
      published_at: comment.timestamp || comment.createdAt || comment.created_at || new Date().toISOString(),
      engagement: {
        likes: comment.likesCount || comment.likes || 0,
        comments: comment.repliesCount || 0,
        shares: 0,
        views: 0,
      },
      hashtags: [],
      media_urls: [],
      raw_data: {
        source: "apify_instagram_comments",
        post_url: postUrl,
        comment_id: comment.id || comment.commentId || null,
      },
    });
  }

  // Fallback: if no comments, use posts themselves
  if (mentions.length === 0) {
    console.log("Instagram Comments: no comments found, falling back to post captions");
    for (const post of posts) {
      const content = (post.caption || post.text || post.alt || "").substring(0, 2000);
      if (content.length < 5) continue;
      const postUrl = post.url || post.postUrl || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : null);
      mentions.push({
        entity_id: entityId,
        source: "instagram_comments",
        source_url: postUrl,
        author_name: post.ownerFullName || post.owner?.fullName || entityName,
        author_handle: post.ownerUsername || post.owner?.username || handle,
        content,
        published_at: post.timestamp || (post.takenAtTimestamp ? new Date(post.takenAtTimestamp * 1000).toISOString() : new Date().toISOString()),
        engagement: {
          likes: post.likesCount || post.likes || 0,
          comments: post.commentsCount || post.comments || 0,
          views: post.videoViewCount || post.views || 0,
          shares: 0,
        },
        hashtags: post.hashtags || [],
        media_urls: post.displayUrl ? [post.displayUrl] : [],
        raw_data: { source: "apify_instagram_posts_fallback" },
      });
    }
  }

  console.log(`Instagram Comments: total ${mentions.length} mentions extracted`);
  return mentions;
}

// ── Facebook via Apify ──
async function collectFacebook(token: string, query: string, entityName: string, entityId: string): Promise<any[]> {
  const searchTerm = query.replace(/"/g, "");
  // tropical_quince~facebook-page-scraper expects pageUrls
  const items = await runApifyActor(token, APIFY_ACTORS.facebook, {
    pageUrls: [`https://www.facebook.com/search/posts/?q=${encodeURIComponent(searchTerm)}`],
    maxPosts: 30,
  });

  return items.map(item => ({
    entity_id: entityId,
    source: "facebook",
    source_url: item.url || item.postUrl || null,
    author_name: item.user?.name || item.pageName || item.authorName || item.name || null,
    author_handle: item.user?.url || item.pageUrl || null,
    content: (item.text || item.message || item.postText || item.content || "").substring(0, 2000),
    published_at: item.time || item.timestamp || item.date || item.postedAt || new Date().toISOString(),
    engagement: {
      likes: item.likes || item.reactionsCount || item.reactions || 0,
      shares: item.shares || item.sharesCount || 0,
      comments: item.comments || item.commentsCount || 0,
      views: item.views || 0,
    },
    hashtags: [],
    media_urls: item.media?.map((m: any) => m.thumbnail || m.url || m) || [],
    raw_data: { source: "apify_facebook", apify_id: item.id },
  })).filter(m => m.content.length > 5);
}

// ══════════════════════════════════════════════════
// ZENSCRAPE (kept for Bing/Yahoo news)
// ══════════════════════════════════════════════════

async function collectViaZenscrape(apiKey: string, searchQuery: string, entityName: string, entityId: string): Promise<any[]> {
  const collectedMentions: any[] = [];
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
        headers: { "apikey": apiKey },
        signal: controller.signal,
      }).catch(e => {
        console.error("Zenscrape fetch error:", e.message);
        return null;
      });

      clearTimeout(timeout);

      if (res?.ok) {
        const html = await res.text();
        console.log(`Zenscrape: received ${html.length} chars`);
        const extracted = extractMentionsFromHTML(html, entityName, "news", entityId);
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

  return collectedMentions;
}

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

// ══════════════════════════════════════════════════
// FACEBOOK COMMENTS (from entity's own page)
// Single-stage: fetch posts and extract topComments directly from results
// ══════════════════════════════════════════════════

async function collectFacebookComments(token: string, fbHandle: string, entityName: string, entityId: string): Promise<any[]> {
  const handle = fbHandle.replace(/^@/, "");
  const pageUrl = `https://www.facebook.com/${handle}`;
  console.log(`Facebook Comments: Stage 1 - fetching posts from ${pageUrl}`);

   // Stage 1: Get post URLs (limit to 10 to maximize collection within timeout)
  const posts = await runApifyActor(token, APIFY_ACTORS.facebook_posts, {
    startUrls: [{ url: pageUrl }],
    maxPosts: 10,
  }, 40);

  if (!posts.length) {
    console.log("Facebook Comments: no posts found");
    return [];
  }

  const postUrls = posts
    .map(p => p.url || p.postUrl || p.link)
    .filter(Boolean)
    .slice(0, 10);

  console.log(`Facebook Comments: Stage 1 got ${posts.length} posts, ${postUrls.length} URLs`);

  if (postUrls.length === 0) return [];

  // Stage 2: Get comments from those posts
  console.log(`Facebook Comments: Stage 2 - fetching comments from ${postUrls.length} posts`);
  const commentItems = await runApifyActor(token, APIFY_ACTORS.facebook_comments, {
    startUrls: postUrls.map(url => ({ url })),
    resultsLimit: 100,
    includeReplies: false,
  }, 90);

  console.log(`Facebook Comments: Stage 2 got ${commentItems.length} comment items`);
  if (commentItems.length > 0) {
    console.log(`Facebook Comments: comment keys: ${Object.keys(commentItems[0]).join(", ")}`);
    console.log(`Facebook Comments: sample: ${JSON.stringify(commentItems[0]).substring(0, 500)}`);
  }

  const mentions: any[] = [];

  for (const comment of commentItems) {
    const content = (comment.text || comment.comment || comment.body || comment.message || comment.content || "").substring(0, 2000);
    if (content.length < 3) continue;

    const postUrl = comment.postUrl || comment.facebookUrl || comment.url || null;
    mentions.push({
      entity_id: entityId,
      source: "facebook_comments",
      source_url: postUrl,
      author_name: comment.profileName || comment.authorName || comment.name || comment.author?.name || null,
      author_handle: comment.profileUrl || comment.authorUrl || comment.author?.url || null,
      content,
      published_at: comment.date || comment.timestamp || comment.created_time || new Date().toISOString(),
      engagement: {
        likes: comment.likesCount || comment.likes || comment.reactionsCount || 0,
        comments: comment.repliesCount || 0,
        shares: 0,
        views: 0,
      },
      hashtags: [],
      media_urls: comment.imageUrl ? [comment.imageUrl] : [],
      raw_data: {
        source: "apify_facebook_comments_scraper",
        post_url: postUrl,
        comment_id: comment.id || comment.commentId || null,
      },
    });
  }

  // If no comments were extracted, fallback to posts themselves
  if (mentions.length === 0) {
    console.log("Facebook Comments: no comments found, falling back to post content");
    for (const post of posts) {
      const content = (post.text || post.message || post.postText || "").substring(0, 2000);
      if (content.length < 5) continue;
      const postUrl = post.url || post.postUrl || post.link || null;
      mentions.push({
        entity_id: entityId,
        source: "facebook_comments",
        source_url: postUrl,
        author_name: post.user?.name || post.pageName || entityName,
        author_handle: post.user?.profileUrl || null,
        content,
        published_at: post.time || (post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString()),
        engagement: {
          likes: post.likes || post.topReactionsCount || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: 0,
        },
        hashtags: [],
        media_urls: post.media?.map((m: any) => m.thumbnail || m.url || m) || [],
        raw_data: { source: "apify_facebook_posts_fallback" },
      });
    }
  }

  console.log(`Facebook Comments: total ${mentions.length} mentions extracted`);
  return mentions;
}

// ══════════════════════════════════════════════════
// TWITTER REPLIES (mentions of entity's handle)
// Single-stage: search for @handle mentions
// ══════════════════════════════════════════════════

async function collectTwitterReplies(token: string, twHandle: string, entityName: string, entityId: string): Promise<any[]> {
  const handle = twHandle.replace(/^@/, "");
  console.log(`Twitter Replies: searching for @${handle} and "${entityName}" mentions`);

  // Search for tweets mentioning the entity (by handle and name)
  const items = await runApifyActor(token, APIFY_ACTORS.twitter, {
    query: `${entityName} OR @${handle}`,
    min_likes: 0,
  }, 90);

  console.log(`Twitter Replies: got ${items.length} items`);

  return items.map(item => ({
    entity_id: entityId,
    source: "twitter_comments",
    source_url: item.url || item.tweet_url || null,
    author_name: item.author_name || item.user_name || item.name || null,
    author_handle: item.author_handle || item.screen_name || item.username || null,
    content: (item.text || item.full_text || item.content || "").substring(0, 2000),
    published_at: item.created_at || item.date || new Date().toISOString(),
    engagement: {
      likes: item.like_count || item.likes || item.favorite_count || 0,
      shares: item.retweet_count || item.retweets || 0,
      comments: item.reply_count || item.replies || 0,
      views: item.view_count || item.views || 0,
    },
    hashtags: item.hashtags || [],
    media_urls: item.media?.map((m: any) => m.url || m) || [],
    raw_data: { source: "apify_twitter_replies" },
  })).filter(m => m.content.length > 5);
}

