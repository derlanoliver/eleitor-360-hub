import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SENTIMENT_TIMELINE, COMMENTS_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities, useSentimentAnalyses, useMentions, useDailySnapshots } from "@/hooks/public-opinion/usePublicOpinion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";

const defaultCategoryScores = [
  { category: 'Saúde', score: 8.2 },
  { category: 'Educação', score: 7.8 },
  { category: 'Segurança', score: 4.5 },
  { category: 'Infraestrutura', score: 7.1 },
  { category: 'Economia', score: 6.3 },
  { category: 'Meio Ambiente', score: 5.9 },
];

const sentimentIcon = (s: string) => {
  if (s === 'positive' || s === 'positivo') return <ThumbsUp className="h-4 w-4 text-green-500" />;
  if (s === 'negative' || s === 'negativo') return <ThumbsDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
};

const SentimentAnalysis = () => {
  const { data: entities } = useMonitoredEntities();
  const principalEntity = entities?.find(e => e.is_principal) || entities?.[0];
  const { data: analyses } = useSentimentAnalyses(principalEntity?.id);
  const { data: mentions } = useMentions(principalEntity?.id, undefined, 50);
  const { data: snapshots } = useDailySnapshots(principalEntity?.id, 30);

  const hasRealData = analyses && analyses.length > 0;

  // Build category scores from real analyses or fallback
  const categoryScores = hasRealData
    ? (() => {
        const catMap: Record<string, { total: number; sum: number }> = {};
        analyses.forEach(a => {
          const cat = a.category || 'Outros';
          if (!catMap[cat]) catMap[cat] = { total: 0, sum: 0 };
          catMap[cat].total++;
          catMap[cat].sum += a.sentiment_score || 0;
        });
        return Object.entries(catMap)
          .map(([category, { total, sum }]) => ({
            category,
            score: Math.round(((sum / total + 1) * 5) * 10) / 10, // normalize -1..1 to 0..10
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
      })()
    : defaultCategoryScores;

  // Timeline from snapshots or mock
  const timelineData = snapshots && snapshots.length > 0
    ? snapshots.map(s => ({
        date: s.snapshot_date,
        positive: s.total_mentions > 0 ? Math.round(s.positive_count / s.total_mentions * 100) : 0,
        negative: s.total_mentions > 0 ? Math.round(s.negative_count / s.total_mentions * 100) : 0,
      }))
    : SENTIMENT_TIMELINE;

  // Build analysis map for mentions
  const analysisMap = new Map(analyses?.map(a => [a.mention_id, a]) || []);

  // Recent classified comments from real data or mock
  const recentComments = hasRealData && mentions && mentions.length > 0
    ? mentions.slice(0, 5).map(m => {
        const a = analysisMap.get(m.id);
        return {
          id: m.id,
          author: m.author_name || m.author_handle || 'Anônimo',
          source: m.source,
          content: m.content,
          sentiment: a?.sentiment === 'positivo' ? 'positive' : a?.sentiment === 'negativo' ? 'negative' : 'neutral',
          category: a?.category || 'sem categoria',
        };
      })
    : COMMENTS_DATA.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análise de Sentimento</h1>
        <p className="text-gray-500 mt-1">
          Análise detalhada do sentimento público por categoria e ao longo do tempo
          {!hasRealData && <Badge variant="outline" className="ml-2">Demo</Badge>}
        </p>
      </div>

      {/* Sentiment by Category (Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Sentimento por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={categoryScores}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumo de Categorização</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryScores.map((c) => (
                <div key={c.category} className="flex items-center justify-between">
                  <span className="font-medium capitalize">{c.category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${c.score >= 7 ? 'bg-green-500' : c.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${c.score * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{c.score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>Evolução Temporal do Sentimento</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="positive" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} name="Positivo %" />
                <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} name="Negativo %" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent classified comments */}
      <Card>
        <CardHeader><CardTitle>Menções Classificadas Recentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentComments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 border rounded-lg p-3">
                {sentimentIcon(c.sentiment)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.author}</span>
                    <Badge variant="outline" className="text-xs">{c.source}</Badge>
                    <Badge variant={c.sentiment === 'positive' ? 'default' : c.sentiment === 'negative' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                      {c.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentAnalysis;
