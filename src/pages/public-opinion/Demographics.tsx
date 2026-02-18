import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMOGRAPHIC_DATA } from "@/data/public-opinion/demoPublicOpinionData";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const genderColors = ['#3b82f6', '#ec4899', '#8b5cf6'];
const ageColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

const Demographics = () => {
  const { gender, age, regions, topics_interest } = DEMOGRAPHIC_DATA;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil do Público & Demografia</h1>
        <p className="text-gray-500 mt-1">Entenda quem fala sobre você e de onde vem a opinião pública</p>
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

        {/* Regions */}
        <Card>
          <CardHeader><CardTitle>Regiões com Mais Menções</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regions.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium truncate">{r.label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${r.value * 3}%`,
                        backgroundColor: r.sentiment >= 0.7 ? '#22c55e' : r.sentiment >= 0.5 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{r.value}%</span>
                  <span className={`text-xs w-16 text-right ${r.sentiment >= 0.6 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {(r.sentiment * 10).toFixed(1)}/10
                  </span>
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
                  <Pie data={topics_interest} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ label, value }) => `${label}: ${value}%`}>
                    {topics_interest.map((_, i) => <Cell key={i} fill={ageColors[i % ageColors.length]} />)}
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
