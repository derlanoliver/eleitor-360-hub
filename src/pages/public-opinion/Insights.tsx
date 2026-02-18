import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AI_INSIGHTS } from "@/data/public-opinion/demoPublicOpinionData";
import { Lightbulb, AlertTriangle, TrendingUp, Target, Sparkles } from "lucide-react";

const typeConfig = {
  opportunity: { icon: Target, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700', label: 'Oportunidade' },
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Alerta' },
  trend: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Tendência' },
  recommendation: { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', label: 'Recomendação' },
};

const impactColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const Insights = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights Automáticos</h1>
          <p className="text-gray-500 mt-1">Recomendações geradas por IA baseadas na análise de sentimento e tendências</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-primary">Resumo Executivo da Semana</h3>
              <p className="text-sm text-gray-700 mt-2">
                Sua imagem pública mantém tendência positiva com score de 7.4/10. A inauguração do hospital em Ceilândia foi o evento de maior impacto, 
                gerando +522% em menções positivas. Atenção recomendada para a pauta de segurança em Sobradinho e Gama, onde o sentimento negativo cresceu 18%. 
                O TikTok emerge como plataforma estratégica com +45% de crescimento em engajamento na faixa 18-34 anos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="space-y-4">
        {AI_INSIGHTS.map((insight) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;
          return (
            <Card key={insight.id} className={`${config.bg} border-0`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={`${config.badge} border-0 text-xs`}>{config.label}</Badge>
                      <Badge className={`${impactColors[insight.impact]} border-0 text-xs`}>
                        Impacto {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(insight.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-24 bg-white rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${insight.confidence}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{insight.confidence}% confiança</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Insights;
