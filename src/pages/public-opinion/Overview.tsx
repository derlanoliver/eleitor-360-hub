import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, MessageSquare, ThumbsUp, ThumbsDown, Minus, Eye } from "lucide-react";
import { SENTIMENT_OVERVIEW, SENTIMENT_TIMELINE } from "@/data/public-opinion/demoPublicOpinionData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

const sourceColors: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  facebook: '#1877F2',
  youtube: '#FF0000',
  tiktok: '#000000',
  portais: '#6B7280',
};

const sentimentColors = ['#22c55e', '#ef4444', '#94a3b8'];

const Overview = () => {
  const data = SENTIMENT_OVERVIEW;
  const sentimentPie = [
    { name: 'Positivo', value: data.positive_pct },
    { name: 'Negativo', value: data.negative_pct },
    { name: 'Neutro', value: data.neutral_pct },
  ];
  const sourceData = Object.entries(data.sources).map(([key, value]) => ({ name: key, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral — Opinião Pública</h1>
        <p className="text-gray-500 mt-1">{data.period}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Menções Totais</p>
                <p className="text-3xl font-bold">{data.total_mentions.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score de Sentimento</p>
                <p className="text-3xl font-bold">{data.sentiment_score}/10</p>
                <div className="flex items-center gap-1 mt-1">
                  {data.trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span className="text-sm text-green-600">+{data.trend_pct}%</span>
                </div>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alcance Estimado</p>
                <p className="text-3xl font-bold">{(data.reach_estimate / 1000000).toFixed(1)}M</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engajamento</p>
                <p className="text-3xl font-bold">{data.engagement_rate}%</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader><CardTitle>Distribuição de Sentimento</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentPie} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {sentimentPie.map((_, i) => <Cell key={i} fill={sentimentColors[i]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader><CardTitle>Menções por Fonte</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))">
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={sourceColors[entry.name] || '#6B7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>Evolução do Sentimento</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SENTIMENT_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Positivo" />
                <Area type="monotone" dataKey="neutral" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.4} name="Neutro" />
                <Area type="monotone" dataKey="negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Negativo" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Hashtags */}
      <Card>
        <CardHeader><CardTitle>Hashtags em Destaque</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {data.top_hashtags.map((h) => (
              <div key={h.tag} className="flex items-center gap-2 border rounded-lg px-4 py-2">
                <span className="font-semibold text-primary">{h.tag}</span>
                <Badge variant={h.sentiment > 0.5 ? 'default' : h.sentiment < 0 ? 'destructive' : 'secondary'}>
                  {h.count.toLocaleString()} menções
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
