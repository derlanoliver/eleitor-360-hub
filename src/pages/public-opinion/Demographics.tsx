import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMOGRAPHIC_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities, useSentimentAnalyses, useMentions } from "@/hooks/public-opinion/usePublicOpinion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const genderColors = ['#3b82f6', '#ec4899', '#8b5cf6'];
const ageColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

const Demographics = () => {
  const { data: entities } = useMonitoredEntities();
  const principalEntity = entities?.find(e => e.is_principal) || entities?.[0];
  const { data: analyses } = useSentimentAnalyses(principalEntity?.id);
  const { data: mentions } = useMentions(principalEntity?.id, undefined, 100);

  const hasRealData = analyses && analyses.length > 0;

  // Build topics of interest from real analyses or fallback
  const topicsData = hasRealData
    ? (() => {
        const topicCounts: Record<string, number> = {};
        analyses.forEach(a => {
          (a.topics || []).forEach(t => {
            topicCounts[t] = (topicCounts[t] || 0) + 1;
          });
        });
        const total = Object.values(topicCounts).reduce((s, v) => s + v, 0) || 1;
        return Object.entries(topicCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([label, count]) => ({ label, value: Math.round(count / total * 100) }));
      })()
    : DEMOGRAPHIC_DATA.topics_interest;

  // Build source distribution from real mentions
  const sourceData = hasRealData && mentions && mentions.length > 0
    ? (() => {
        const sourceCounts: Record<string, number> = {};
        mentions.forEach(m => {
          sourceCounts[m.source] = (sourceCounts[m.source] || 0) + 1;
        });
        const total = mentions.length || 1;
        return Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([label, count]) => ({ label, value: Math.round(count / total * 100), sentiment: 0.6 }));
      })()
    : DEMOGRAPHIC_DATA.regions;

  // Gender and age — no real data source for these, always use demo
  const { gender, age } = DEMOGRAPHIC_DATA;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil do Público & Demografia</h1>
        <p className="text-gray-500 mt-1">
          Entenda quem fala sobre você e de onde vem a opinião pública
          {!hasRealData && <Badge variant="outline" className="ml-2">Demo</Badge>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender */}
        <Card>
          <CardHeader><CardTitle>Gênero do Público</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gender} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ label, value }) => `${label}: ${value}%`}>
                    {gender.map((_, i) => <Cell key={i} fill={genderColors[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Age */}
        <Card>
          <CardHeader><CardTitle>Faixa Etária</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={age}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="%" radius={[4, 4, 0, 0]}>
                    {age.map((_, i) => <Cell key={i} fill={ageColors[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sources / Regions */}
        <Card>
          <CardHeader><CardTitle>{hasRealData ? 'Distribuição por Fonte' : 'Regiões com Mais Menções'}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sourceData.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium truncate capitalize">{r.label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-primary"
                      style={{ width: `${Math.min(r.value * 3, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{r.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topics of Interest */}
        <Card>
          <CardHeader><CardTitle>Temas de Maior Interesse</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topicsData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ label, value }) => `${label}: ${value}%`}>
                    {topicsData.map((_, i) => <Cell key={i} fill={ageColors[i % ageColors.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Demographics;
