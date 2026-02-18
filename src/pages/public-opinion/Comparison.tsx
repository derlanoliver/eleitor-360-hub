import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMPETITOR_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities, usePoOverviewStats } from "@/hooks/public-opinion/usePublicOpinion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { TrendingUp, Users, MessageSquare, ThumbsUp } from "lucide-react";

const entityColors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#22c55e'];

const Comparison = () => {
  const { data: entities } = useMonitoredEntities();
  const hasRealEntities = entities && entities.length > 1;

  // For each entity, get overview stats (we'll use the hook for the principal one)
  // For a proper multi-entity comparison, we'd need stats for each entity
  // For now, use real entities metadata with demo stats fallback
  const comparisonData = hasRealEntities
    ? entities.map((e, i) => ({
        id: e.id,
        nome: e.nome,
        partido: e.partido || '-',
        foto_url: e.avatar_url,
        mentions: 0,
        positive_pct: 0,
        negative_pct: 0,
        neutral_pct: 0,
        sentiment_score: 0,
        followers_total: 0,
        engagement_rate: 0,
        top_topics: e.palavras_chave?.slice(0, 3) || [],
        color: entityColors[i % entityColors.length],
        is_principal: e.is_principal,
      }))
    : COMPETITOR_DATA;

  const radarData = [
    { metric: 'Sentimento', ...Object.fromEntries(comparisonData.map(c => [c.nome, (c.sentiment_score || 5) * 10])) },
    { metric: 'Engajamento', ...Object.fromEntries(comparisonData.map(c => [c.nome, (c.engagement_rate || 3) * 20])) },
    { metric: 'Menções', ...Object.fromEntries(comparisonData.map(c => [c.nome, Math.min((c.mentions || 100) / 130, 100)])) },
    { metric: 'Aprovação', ...Object.fromEntries(comparisonData.map(c => [c.nome, c.positive_pct || 50])) },
    { metric: 'Alcance', ...Object.fromEntries(comparisonData.map(c => [c.nome, Math.min((c.followers_total || 100000) / 2500, 100)])) },
  ];

  const barData = comparisonData.map(c => ({
    nome: c.nome.split(' ')[0],
    Positivo: c.positive_pct || COMPETITOR_DATA.find(d => d.id === c.id)?.positive_pct || 50,
    Negativo: c.negative_pct || COMPETITOR_DATA.find(d => d.id === c.id)?.negative_pct || 25,
    Neutro: c.neutral_pct || COMPETITOR_DATA.find(d => d.id === c.id)?.neutral_pct || 25,
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
                  <span className="font-semibold">{(c.mentions || COMPETITOR_DATA[0]?.mentions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Sentimento</span>
                  <span className="font-semibold">{c.sentiment_score || COMPETITOR_DATA[0]?.sentiment_score || 0}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Engajamento</span>
                  <span className="font-semibold">{c.engagement_rate || COMPETITOR_DATA[0]?.engagement_rate || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Seguidores</span>
                  <span className="font-semibold">{((c.followers_total || COMPETITOR_DATA[0]?.followers_total || 0) / 1000).toFixed(0)}K</span>
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
