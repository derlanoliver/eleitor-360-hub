import { supabase } from "@/integrations/supabase/client";
import type { SentimentAnalysis, DailySnapshot, Mention, PoEvent } from "./usePublicOpinion";

// ── Paginated fetch helper ──
async function fetchAllPaginated<T>(
  table: string,
  filters: { column: string; value: string }[],
  dateFilter?: { column: string; since: string },
  orderBy?: { column: string; ascending: boolean },
  limit?: number
): Promise<T[]> {
  const results: T[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    let q = (supabase as any).from(table).select("*");
    filters.forEach((f) => { q = q.eq(f.column, f.value); });
    if (dateFilter) q = q.gte(dateFilter.column, dateFilter.since);
    if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending });
    q = q.range(from, from + batchSize - 1);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...(data as T[]));
    if (limit && results.length >= limit) return results.slice(0, limit);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return results;
}

// ── Data types for reports ──
export interface WeeklyReportData {
  entityName: string;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avgScore: number;
  snapshots: DailySnapshot[];
  topTopics: { name: string; count: number }[];
  topEmotions: { name: string; count: number }[];
  topMentions: Mention[];
}

export interface ComparisonReportData {
  entities: {
    name: string;
    total: number;
    positivePct: number;
    negativePct: number;
    neutralPct: number;
    avgScore: number;
  }[];
}

export interface EventReportData {
  event: PoEvent;
  entityName: string;
  mentionsBefore: number;
  mentionsAfter: number;
  sentimentBefore: number;
  sentimentAfter: number;
  relatedMentions: Mention[];
}

export interface DemographicReportData {
  entityName: string;
  sources: {
    source: string;
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    positivePct: string;
    negativePct: string;
    neutralPct: string;
  }[];
}

export interface ExecutiveReportData {
  entityName: string;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avgScore: number;
  trend: string;
  topTopics: { name: string; count: number }[];
  topCategories: { name: string; count: number }[];
}

// ── Helper: count top items ──
function getTopItems(items: string[], limit: number) {
  const counts: Record<string, number> = {};
  items.forEach((i) => (counts[i] = (counts[i] || 0) + 1));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

// ── Fetch functions ──

export async function fetchWeeklyReportData(entityId: string, entityName: string): Promise<WeeklyReportData> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();

  const [analyses, snapshots, mentions] = await Promise.all([
    fetchAllPaginated<SentimentAnalysis>("po_sentiment_analyses", [{ column: "entity_id", value: entityId }], { column: "analyzed_at", since: sinceStr }),
    fetchAllPaginated<DailySnapshot>("po_daily_snapshots", [{ column: "entity_id", value: entityId }], { column: "snapshot_date", since: sinceStr.split("T")[0] }, { column: "snapshot_date", ascending: true }),
    fetchAllPaginated<Mention>("po_mentions", [{ column: "entity_id", value: entityId }], { column: "collected_at", since: sinceStr }, { column: "published_at", ascending: false }, 10),
  ]);

  const positive = analyses.filter((a) => a.sentiment === "positivo").length;
  const negative = analyses.filter((a) => a.sentiment === "negativo").length;
  const neutral = analyses.filter((a) => a.sentiment === "neutro").length;
  const avgScore = analyses.length ? analyses.reduce((s, a) => s + (a.sentiment_score || 0), 0) / analyses.length : 0;

  return {
    entityName,
    total: analyses.length,
    positive,
    negative,
    neutral,
    avgScore,
    snapshots,
    topTopics: getTopItems(analyses.flatMap((a) => a.topics || []), 5),
    topEmotions: getTopItems(analyses.flatMap((a) => a.emotions || []), 5),
    topMentions: mentions,
  };
}

export async function fetchComparisonReportData(): Promise<ComparisonReportData> {
  const { data: entities, error } = await supabase
    .from("po_monitored_entities")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString();

  const results = await Promise.all(
    (entities || []).map(async (entity: any) => {
      const analyses = await fetchAllPaginated<SentimentAnalysis>("po_sentiment_analyses", [{ column: "entity_id", value: entity.id }], { column: "analyzed_at", since: sinceStr });
      const total = analyses.length;
      const positive = analyses.filter((a) => a.sentiment === "positivo").length;
      const negative = analyses.filter((a) => a.sentiment === "negativo").length;
      const neutral = analyses.filter((a) => a.sentiment === "neutro").length;
      const avgScore = total ? analyses.reduce((s, a) => s + (a.sentiment_score || 0), 0) / total : 0;
      return {
        name: entity.nome,
        total,
        positivePct: total ? Math.round((positive / total) * 100) : 0,
        negativePct: total ? Math.round((negative / total) * 100) : 0,
        neutralPct: total ? Math.round((neutral / total) * 100) : 0,
        avgScore: Math.round(avgScore * 100) / 100,
      };
    })
  );

  return { entities: results.sort((a, b) => b.total - a.total) };
}

export async function fetchEventReportData(eventId: string, entityName: string): Promise<EventReportData> {
  const { data: event, error } = await supabase
    .from("po_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error) throw error;

  const eventDate = new Date(event.data_evento);
  const before = new Date(eventDate);
  before.setDate(before.getDate() - 7);
  const after = new Date(eventDate);
  after.setDate(after.getDate() + 7);

  const [analysesBefore, analysesAfter, mentions] = await Promise.all([
    fetchAllPaginated<SentimentAnalysis>("po_sentiment_analyses", [{ column: "entity_id", value: event.entity_id }], { column: "analyzed_at", since: before.toISOString() }),
    fetchAllPaginated<SentimentAnalysis>("po_sentiment_analyses", [{ column: "entity_id", value: event.entity_id }], { column: "analyzed_at", since: eventDate.toISOString() }),
    fetchAllPaginated<Mention>("po_mentions", [{ column: "entity_id", value: event.entity_id }], { column: "collected_at", since: before.toISOString() }, { column: "published_at", ascending: false }, 20),
  ]);

  const beforeOnly = analysesBefore.filter((a) => new Date(a.analyzed_at) < eventDate);
  const afterOnly = analysesAfter.filter((a) => new Date(a.analyzed_at) <= after);

  const avgBefore = beforeOnly.length ? beforeOnly.reduce((s, a) => s + (a.sentiment_score || 0), 0) / beforeOnly.length : 0;
  const avgAfter = afterOnly.length ? afterOnly.reduce((s, a) => s + (a.sentiment_score || 0), 0) / afterOnly.length : 0;

  return {
    event: event as PoEvent,
    entityName,
    mentionsBefore: beforeOnly.length,
    mentionsAfter: afterOnly.length,
    sentimentBefore: avgBefore,
    sentimentAfter: avgAfter,
    relatedMentions: mentions,
  };
}

export async function fetchDemographicReportData(entityId: string, entityName: string): Promise<DemographicReportData> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [mentions, analyses] = await Promise.all([
    fetchAllPaginated<Mention>("po_mentions", [{ column: "entity_id", value: entityId }], { column: "collected_at", since: since.toISOString() }),
    fetchAllPaginated<SentimentAnalysis>("po_sentiment_analyses", [{ column: "entity_id", value: entityId }], { column: "analyzed_at", since: since.toISOString() }),
  ]);

  const analysisMap = new Map(analyses.map((a) => [a.mention_id, a]));

  const sourceMap: Record<string, { total: number; positive: number; negative: number; neutral: number }> = {};
  mentions.forEach((m) => {
    if (!sourceMap[m.source]) sourceMap[m.source] = { total: 0, positive: 0, negative: 0, neutral: 0 };
    sourceMap[m.source].total++;
    const analysis = analysisMap.get(m.id);
    if (analysis) {
      if (analysis.sentiment === "positivo") sourceMap[m.source].positive++;
      else if (analysis.sentiment === "negativo") sourceMap[m.source].negative++;
      else sourceMap[m.source].neutral++;
    }
  });

  const sources = Object.entries(sourceMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([source, data]) => ({
      source,
      ...data,
      positivePct: data.total ? ((data.positive / data.total) * 100).toFixed(1) : "0",
      negativePct: data.total ? ((data.negative / data.total) * 100).toFixed(1) : "0",
      neutralPct: data.total ? ((data.neutral / data.total) * 100).toFixed(1) : "0",
    }));

  return { entityName, sources };
}

export async function fetchExecutiveReportData(entityId: string, entityName: string): Promise<ExecutiveReportData> {
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);

  const [currentAnalyses, prevAnalyses] = await Promise.all([
    fetchAllPaginated<SentimentAnalysis>("po_sentiment_analyses", [{ column: "entity_id", value: entityId }], { column: "analyzed_at", since: since7.toISOString() }),
    fetchAllPaginated<SentimentAnalysis>("po_sentiment_analyses", [{ column: "entity_id", value: entityId }], { column: "analyzed_at", since: since14.toISOString() }),
  ]);

  const prevOnly = prevAnalyses.filter((a) => new Date(a.analyzed_at) < since7);
  const trend = currentAnalyses.length > prevOnly.length ? "↑ Crescimento" : currentAnalyses.length < prevOnly.length ? "↓ Queda" : "→ Estável";

  const positive = currentAnalyses.filter((a) => a.sentiment === "positivo").length;
  const negative = currentAnalyses.filter((a) => a.sentiment === "negativo").length;
  const neutral = currentAnalyses.filter((a) => a.sentiment === "neutro").length;
  const avgScore = currentAnalyses.length ? currentAnalyses.reduce((s, a) => s + (a.sentiment_score || 0), 0) / currentAnalyses.length : 0;

  return {
    entityName,
    total: currentAnalyses.length,
    positive,
    negative,
    neutral,
    avgScore,
    trend,
    topTopics: getTopItems(currentAnalyses.flatMap((a) => a.topics || []), 5),
    topCategories: getTopItems(currentAnalyses.map((a) => a.category).filter(Boolean) as string[], 5),
  };
}
