import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMPETITOR_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { TrendingUp, Users, MessageSquare, ThumbsUp } from "lucide-react";

const radarData = [
  { metric: 'Sentimento', ...Object.fromEntries(COMPETITOR_DATA.map(c => [c.nome, c.sentiment_score * 10])) },
  { metric: 'Engajamento', ...Object.fromEntries(COMPETITOR_DATA.map(c => [c.nome, c.engagement_rate * 20])) },
  { metric: 'Menções', ...Object.fromEntries(COMPETITOR_DATA.map(c => [c.nome, (c.mentions / 130)])) },
  { metric: 'Aprovação', ...Object.fromEntries(COMPETITOR_DATA.map(c => [c.nome, c.positive_pct])) },
  { metric: 'Alcance', ...Object.fromEntries(COMPETITOR_DATA.map(c => [c.nome, (c.followers_total / 2500)])) },
];

const Comparison = () => {
  const barData = COMPETITOR_DATA.map(c => ({
    nome: c.nome.split(' ')[0],
    Positivo: c.positive_pct,
    Negativo: c.negative_pct,
    Neutro: c.neutral_pct,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comparação Político vs Político</h1>
        <p className="text-gray-500 mt-1">Compare métricas de opinião pública com adversários políticos</p>
      </div>

      {/* Cards comparativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COMPETITOR_DATA.map((c) => (
          <Card key={c.id} className={c.id === '1' ? 'border-primary border-2' : ''}>
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
                  <span className="font-semibold">{c.mentions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Sentimento</span>
                  <span className="font-semibold">{c.sentiment_score}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Engajamento</span>
                  <span className="font-semibold">{c.engagement_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Seguidores</span>
                  <span className="font-semibold">{(c.followers_total / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.top_topics.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
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
                {COMPETITOR_DATA.map((c) => (
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
