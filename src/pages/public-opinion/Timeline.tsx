import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SENTIMENT_TIMELINE, ANALYZED_EVENTS } from "@/data/public-opinion/demoPublicOpinionData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine } from "recharts";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";

const Timeline = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Linha do Tempo</h1>
        <p className="text-gray-500 mt-1">Cronologia de menções e sentimentos correlacionados com eventos públicos</p>
      </div>

      {/* Mentions over time with event markers */}
      <Card>
        <CardHeader><CardTitle>Volume de Menções ao Longo do Tempo</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SENTIMENT_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="mentions" fill="hsl(var(--primary))" name="Menções" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment line */}
      <Card>
        <CardHeader><CardTitle>Sentimento Positivo vs Negativo (Tendência)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SENTIMENT_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} name="Positivo %" dot />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} name="Negativo %" dot />
                <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Events Timeline */}
      <Card>
        <CardHeader><CardTitle>Eventos Analisados na Linha do Tempo</CardTitle></CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {ANALYZED_EVENTS.map((event) => {
                const sentimentDiff = event.sentiment_after - event.sentiment_before;
                return (
                  <div key={event.id} className="relative flex gap-4 pl-10">
                    <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-white shadow" />
                    <div className="border rounded-lg p-4 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                        <Badge variant="outline">{event.type}</Badge>
                        {sentimentDiff > 0 ? (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <TrendingUp className="h-3 w-3 mr-1" /> +{(sentimentDiff * 100).toFixed(0)}% sentimento
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-0">
                            <TrendingDown className="h-3 w-3 mr-1" /> {(sentimentDiff * 100).toFixed(0)}% sentimento
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.summary}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Menções: {event.mentions_before} → {event.mentions_after.toLocaleString()}</span>
                        <span>Alcance: {(event.reach / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Timeline;
