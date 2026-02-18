import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AI_INSIGHTS } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities, useGenerateInsights } from "@/hooks/public-opinion/usePublicOpinion";
import { Lightbulb, AlertTriangle, TrendingUp, Target, Sparkles, Loader2, RefreshCw } from "lucide-react";

const typeConfig: Record<string, any> = {
  opportunity: { icon: Target, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700', label: 'Oportunidade' },
  oportunidade: { icon: Target, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700', label: 'Oportunidade' },
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Alerta' },
  alerta: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Alerta' },
  trend: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Tendência' },
  "tendência": { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Tendência' },
  recommendation: { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', label: 'Recomendação' },
  "recomendação": { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', label: 'Recomendação' },
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700', alta: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700', "média": 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700', baixa: 'bg-green-100 text-green-700',
};

const Insights = () => {
  const { data: entities } = useMonitoredEntities();
  const principalEntity = entities?.find(e => e.is_principal) || entities?.[0];
  const generateInsights = useGenerateInsights();
  const [aiInsights, setAiInsights] = useState<any[] | null>(null);
  const [aiStats, setAiStats] = useState<any | null>(null);

  const handleGenerate = async () => {
    if (!principalEntity) return;
    const result = await generateInsights.mutateAsync({ entity_id: principalEntity.id, period_days: 7 });
    if (result?.insights) {
      setAiInsights(result.insights);
      setAiStats(result.stats);
    }
  };

  const insights = aiInsights || AI_INSIGHTS;
  const isDemo = !aiInsights;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insights Automáticos</h1>
            <p className="text-gray-500 mt-1">
              Recomendações geradas por IA baseadas na análise de sentimento
              {isDemo && <Badge variant="outline" className="ml-2">Demo</Badge>}
            </p>
          </div>
        </div>
        {principalEntity && (
          <Button
            onClick={handleGenerate}
            disabled={generateInsights.isPending}
          >
            {generateInsights.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar Insights com IA
          </Button>
        )}
      </div>

      {/* AI Stats */}
      {aiStats && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-primary">Resumo da Análise</h3>
                <p className="text-sm text-gray-700 mt-2">
                  {aiStats.total} menções analisadas — {aiStats.positive} positivas ({Math.round(aiStats.positive/aiStats.total*100)}%), 
                  {aiStats.negative} negativas ({Math.round(aiStats.negative/aiStats.total*100)}%), 
                  {aiStats.neutral} neutras. Score médio: {(aiStats.avgScore * 10).toFixed(1)}/10.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!aiStats && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-primary">Resumo Executivo da Semana</h3>
                <p className="text-sm text-gray-700 mt-2">
                  Sua imagem pública mantém tendência positiva com score de 7.4/10. A inauguração do hospital em Ceilândia foi o evento de maior impacto, 
                  gerando +522% em menções positivas. Atenção recomendada para a pauta de segurança em Sobradinho e Gama, onde o sentimento negativo cresceu 18%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <div className="space-y-4">
        {insights.map((insight: any, idx: number) => {
          const type = insight.type || 'recommendation';
          const config = typeConfig[type] || typeConfig.recommendation;
          const Icon = config.icon;
          const priority = insight.priority || insight.impact || 'medium';
          const confidence = typeof insight.confidence === 'number' 
            ? (insight.confidence <= 1 ? Math.round(insight.confidence * 100) : insight.confidence)
            : 75;
          return (
            <Card key={insight.id || idx} className={`${config.bg} border-0`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={`${config.badge} border-0 text-xs`}>{config.label}</Badge>
                      <Badge className={`${priorityColors[priority] || priorityColors.medium} border-0 text-xs`}>
                        Prioridade {priority === 'high' || priority === 'alta' ? 'Alta' : priority === 'low' || priority === 'baixa' ? 'Baixa' : 'Média'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                    {insight.topics?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {insight.topics.map((t: string) => (
                          <Badge key={t} variant="outline" className="text-xs capitalize">{t}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-24 bg-white rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${confidence}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{confidence}% confiança</span>
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
