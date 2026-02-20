import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMPETITOR_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities } from "@/hooks/public-opinion/usePublicOpinion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { TrendingUp, Users, MessageSquare, ThumbsUp } from "lucide-react";

const entityColors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#22c55e'];

function useEntityStats(entityId?: string) {
  return useQuery({
    queryKey: ["po_comparison_stats", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const [mentionsRes, analysesRes] = await Promise.all([
        supabase
          .from("po_mentions")
          .select("id, source, engagement")
          .eq("entity_id", entityId!)
          .gte("collected_at", since.toISOString()),
        supabase
          .from("po_sentiment_analyses")
          .select("sentiment, sentiment_score, topics, category")
          .eq("entity_id", entityId!)
          .gte("analyzed_at", since.toISOString()),
      ]);

      const mentions = mentionsRes.data || [];
      const analyses = analysesRes.data || [];
      const total = analyses.length;
      const positive = analyses.filter(a => a.sentiment === "positivo").length;
      const negative = analyses.filter(a => a.sentiment === "negativo").length;
      const neutral = analyses.filter(a => a.sentiment === "neutro").length;
      const avgScore = total > 0
        ? analyses.reduce((s, a) => s + (Number(a.sentiment_score) || 0), 0) / total
        : 0;

      // Top topics
      const topicCounts: Record<string, number> = {};
      analyses.forEach(a => (a.topics || []).forEach((t: string) => topicCounts[t] = (topicCounts[t] || 0) + 1));
      const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

      // Total engagement
      let totalEngagement = 0;
      mentions.forEach(m => {
        const eng = m.engagement as Record<string, number> | null;
        if (eng) totalEngagement += Object.values(eng).reduce((s, v) => s + (v || 0), 0);
      });

      return {
        mentions: mentions.length,
        positive_pct: total > 0 ? Math.round((positive / total) * 100) : 0,
        negative_pct: total > 0 ? Math.round((negative / total) * 100) : 0,
        neutral_pct: total > 0 ? Math.round((neutral / total) * 100) : 0,
        sentiment_score: Math.round(avgScore * 10) / 10,
        engagement_total: totalEngagement,
        engagement_rate: mentions.length > 0 ? Math.round((totalEngagement / mentions.length) * 10) / 10 : 0,
        top_topics: topTopics,
      };
    },
  });
}

const Comparison = () => {
  const { data: entities } = useMonitoredEntities();
  const hasRealEntities = entities && entities.length > 1;

  // Fetch stats for up to 5 entities
  const e0 = useEntityStats(entities?.[0]?.id);
  const e1 = useEntityStats(entities?.[1]?.id);
  const e2 = useEntityStats(entities?.[2]?.id);
  const e3 = useEntityStats(entities?.[3]?.id);
  const e4 = useEntityStats(entities?.[4]?.id);
  const statsArr = [e0, e1, e2, e3, e4];

  const comparisonData = hasRealEntities
    ? entities.map((e, i) => {
        const s = statsArr[i]?.data;
        return {
          id: e.id,
          nome: e.nome,
          partido: e.partido || '-',
          foto_url: e.avatar_url,
          mentions: s?.mentions || 0,
          positive_pct: s?.positive_pct || 0,
          negative_pct: s?.negative_pct || 0,
          neutral_pct: s?.neutral_pct || 0,
          sentiment_score: s?.sentiment_score || 0,
          followers_total: s?.engagement_total || 0,
          engagement_rate: s?.engagement_rate || 0,
          top_topics: s?.top_topics?.length ? s.top_topics : e.palavras_chave?.slice(0, 3) || [],
          color: entityColors[i % entityColors.length],
          is_principal: e.is_principal,
        };
      })
    : COMPETITOR_DATA;

  const radarData = [
    { metric: 'Sentimento', ...Object.fromEntries(comparisonData.map(c => [c.nome, Math.max((c.sentiment_score || 0) * 10, 0)])) },
    { metric: 'Engajamento', ...Object.fromEntries(comparisonData.map(c => [c.nome, Math.min((c.engagement_rate || 0) * 5, 100)])) },
    { metric: 'Menções', ...Object.fromEntries(comparisonData.map(c => {
      const maxMentions = Math.max(...comparisonData.map(x => x.mentions || 1));
      return [c.nome, Math.round(((c.mentions || 0) / maxMentions) * 100)];
    })) },
    { metric: 'Aprovação', ...Object.fromEntries(comparisonData.map(c => [c.nome, c.positive_pct || 0])) },
    { metric: 'Alcance', ...Object.fromEntries(comparisonData.map(c => {
      const maxEng = Math.max(...comparisonData.map(x => x.followers_total || 1));
      return [c.nome, Math.round(((c.followers_total || 0) / maxEng) * 100)];
    })) },
  ];

  const barData = comparisonData.map(c => ({
    nome: c.nome.split(' ')[0],
    Positivo: c.positive_pct || COMPETITOR_DATA.find(d => d.id === c.id)?.positive_pct || 0,
    Negativo: c.negative_pct || COMPETITOR_DATA.find(d => d.id === c.id)?.negative_pct || 0,
    Neutro: c.neutral_pct || COMPETITOR_DATA.find(d => d.id === c.id)?.neutral_pct || 0,
  }));

  const isDemo = !hasRealEntities;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comparação Político vs Político</h1>
        <p className="text-gray-500 mt-1">
          Compare métricas de opinião pública com adversários políticos
          {isDemo && <Badge variant="outline" className="ml-2">Demo</Badge>}
        </p>
      </div>

      {/* Cards comparativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisonData.map((c) => (
          <Card key={c.id} className={'is_principal' in c && (c as any).is_principal || c.id === '1' ? 'border-primary border-2' : ''}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: c.color }}>
                  {c.nome.charAt(0)}
                </div>
                <h3 className="font-bold mt-3">{c.nome}</h3>
                <Badge variant="outline" className="mt-1">{c.partido}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Menções</span>
                  <span className="font-semibold">{(c.mentions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Sentimento</span>
                  <span className="font-semibold">{c.sentiment_score || 0}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Engajamento</span>
                  <span className="font-semibold">{c.engagement_rate || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Engajamento Total</span>
                  <span className="font-semibold">{((c.followers_total || 0) / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(c.top_topics.length > 0 ? c.top_topics : ['Geral']).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Radar comparison */}
      <Card>
        <CardHeader><CardTitle>Comparação Multidimensional</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                {comparisonData.map((c) => (
                  <Radar key={c.id} name={c.nome} dataKey={c.nome} stroke={c.color} fill={c.color} fillOpacity={0.15} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment comparison bar */}
      <Card>
        <CardHeader><CardTitle>Distribuição de Sentimento Comparada</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Positivo" fill="#22c55e" />
                <Bar dataKey="Neutro" fill="#94a3b8" />
                <Bar dataKey="Negativo" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Comparison;
