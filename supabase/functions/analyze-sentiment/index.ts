import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mention_ids, entity_id } = await req.json();

    if (!mention_ids?.length) throw new Error("mention_ids is required");

    // Fetch mentions to analyze
    const { data: mentions, error: fetchError } = await supabase
      .from("po_mentions")
      .select("id, content, source, author_name, hashtags")
      .in("id", mention_ids);

    if (fetchError) throw fetchError;
    if (!mentions?.length) throw new Error("No mentions found");

    // Fetch entity info for context
    const { data: entity } = await supabase
      .from("po_monitored_entities")
      .select("nome, tipo, partido, cargo, palavras_chave")
      .eq("id", entity_id)
      .single();

    // Fetch adversaries for comparison context
    const { data: adversaries } = await supabase
      .from("po_monitored_entities")
      .select("id, nome, partido")
      .eq("tipo", "adversario")
      .eq("is_active", true);

    const adversaryNames = adversaries?.map(a => a.nome) || [];

    const systemPrompt = `Você é um analista especializado em opinião pública e comunicação política brasileira.
Analise cada menção e retorne um JSON com a análise de sentimento e categorização.

Contexto:
- Entidade principal: ${entity?.nome || "Desconhecida"} (${entity?.tipo || "político"}, ${entity?.partido || ""}, ${entity?.cargo || ""})
- Adversários conhecidos: ${adversaryNames.join(", ") || "Nenhum cadastrado"}

Para cada menção, determine:
1. sentiment: "positivo", "negativo" ou "neutro"
2. sentiment_score: número de -1.000 (muito negativo) a 1.000 (muito positivo)
3. category: uma de: "elogio", "reclamação", "dúvida", "sugestão", "notícia", "ataque", "defesa", "humor", "fake_news"
4. subcategory: detalhamento livre da categoria
5. topics: array de temas (saúde, segurança, educação, transporte, meio_ambiente, economia, infraestrutura, política, social, cultura, esporte)
6. emotions: array de emoções detectadas (raiva, esperança, medo, alegria, tristeza, indignação, orgulho, deboche, ironia)
7. is_about_adversary: boolean se menciona adversário
8. adversary_entity_id: UUID do adversário se aplicável, ou null
9. confidence: 0.00 a 1.00
10. ai_summary: resumo de 1 linha do sentimento`;

    const mentionsText = mentions.map((m, i) => 
      `[${i}] ID: ${m.id}\nFonte: ${m.source}\nAutor: ${m.author_name || "Anônimo"}\nConteúdo: ${m.content}\nHashtags: ${(m.hashtags || []).join(", ")}`
    ).join("\n\n---\n\n");

    const adversaryMap = adversaries?.reduce((acc: Record<string, string>, a) => {
      acc[a.nome] = a.id;
      return acc;
    }, {}) || {};

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise as seguintes ${mentions.length} menções e retorne APENAS um JSON array com os resultados:\n\n${mentionsText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_sentiment_analyses",
            description: "Save sentiment analysis results for mentions",
            parameters: {
              type: "object",
              properties: {
                analyses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      mention_index: { type: "number" },
                      sentiment: { type: "string", enum: ["positivo", "negativo", "neutro"] },
                      sentiment_score: { type: "number" },
                      category: { type: "string" },
                      subcategory: { type: "string" },
                      topics: { type: "array", items: { type: "string" } },
                      emotions: { type: "array", items: { type: "string" } },
                      is_about_adversary: { type: "boolean" },
                      adversary_name: { type: "string" },
                      confidence: { type: "number" },
                      ai_summary: { type: "string" },
                    },
                    required: ["mention_index", "sentiment", "sentiment_score", "category", "confidence", "ai_summary"],
                  },
                },
              },
              required: ["analyses"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_sentiment_analyses" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) throw new Error("No tool call in AI response");

    const { analyses } = JSON.parse(toolCall.function.arguments);

    // Save analyses to database
    const records = analyses.map((a: any) => {
      const mention = mentions[a.mention_index];
      if (!mention) return null;
      return {
        mention_id: mention.id,
        entity_id,
        sentiment: a.sentiment,
        sentiment_score: a.sentiment_score,
        category: a.category,
        subcategory: a.subcategory || null,
        topics: a.topics || [],
        emotions: a.emotions || [],
        is_about_adversary: a.is_about_adversary || false,
        adversary_entity_id: a.adversary_name ? (adversaryMap[a.adversary_name] || null) : null,
        confidence: a.confidence,
        ai_summary: a.ai_summary,
        ai_model: "google/gemini-3-flash-preview",
      };
    }).filter(Boolean);

    const { data: inserted, error: insertError } = await supabase
      .from("po_sentiment_analyses")
      .insert(records)
      .select("id");

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ 
      success: true, 
      analyzed: inserted?.length || 0,
      total_mentions: mentions.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-sentiment error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
