import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REPORT_TEMPLATES } from "@/data/public-opinion/demoPublicOpinionData";
import { useMonitoredEntities, usePoOverviewStats } from "@/hooks/public-opinion/usePublicOpinion";
import { FileText, Download, Calendar, Clock, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchWeeklyReportData,
  fetchComparisonReportData,
  fetchEventReportData,
  fetchDemographicReportData,
  fetchExecutiveReportData,
} from "@/hooks/public-opinion/usePoReportData";
import {
  generateWeeklyReport,
  generateComparisonReport,
  generateEventReport,
  generateExecutiveReport,
} from "@/utils/generatePoReportPdf";
import { generateDemographicExcel } from "@/utils/generatePoReportExcel";
import { SelectEventReportDialog } from "@/components/public-opinion/SelectEventReportDialog";

const typeLabels: Record<string, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  sob_demanda: 'Sob Demanda',
};

const Reports = () => {
  const { data: entities } = useMonitoredEntities();
  const principalEntity = entities?.find(e => e.is_principal) || entities?.[0];
  const { stats } = usePoOverviewStats(principalEntity?.id);
  const hasRealData = !!stats && stats.total > 0;

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("po_report_dates") || "{}"); } catch { return {}; }
  });

  const saveLastGenerated = (id: string) => {
    const updated = { ...lastGenerated, [id]: new Date().toISOString() };
    setLastGenerated(updated);
    localStorage.setItem("po_report_dates", JSON.stringify(updated));
  };

  const handleGenerate = async (reportId: string) => {
    if (!principalEntity) {
      toast.error("Nenhuma entidade monitorada encontrada");
      return;
    }

    if (reportId === "3") {
      setEventDialogOpen(true);
      return;
    }

    setLoadingId(reportId);
    try {
      switch (reportId) {
        case "1": {
          const data = await fetchWeeklyReportData(principalEntity.id, principalEntity.nome);
          generateWeeklyReport(data);
          break;
        }
        case "2": {
          const data = await fetchComparisonReportData();
          generateComparisonReport(data);
          break;
        }
        case "4": {
          const data = await fetchDemographicReportData(principalEntity.id, principalEntity.nome);
          generateDemographicExcel(data);
          break;
        }
        case "5": {
          const data = await fetchExecutiveReportData(principalEntity.id, principalEntity.nome);
          generateExecutiveReport(data);
          break;
        }
      }
      saveLastGenerated(reportId);
      toast.success("Relatório gerado com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleEventSelect = async (eventId: string) => {
    if (!principalEntity) return;
    setLoadingId("3");
    try {
      const data = await fetchEventReportData(eventId, principalEntity.nome);
      generateEventReport(data);
      saveLastGenerated("3");
      toast.success("Relatório de evento gerado com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setLoadingId(null);
      setEventDialogOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Gere e baixe relatórios de opinião pública para tomada de decisão
          {!hasRealData && <Badge variant="outline" className="ml-2">Demo</Badge>}
        </p>
      </div>

      {hasRealData && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-primary">Dados Disponíveis</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.total} menções analisadas nos últimos 30 dias — {stats.positive} positivas, {stats.negative} negativas, {stats.neutral} neutras.
                  Os relatórios serão gerados com base nesses dados reais.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TEMPLATES.map((r) => {
          const isLoading = loadingId === r.id;
          const lastDate = lastGenerated[r.id];
          return (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{r.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{typeLabels[r.type]}</Badge>
                      <Badge variant="secondary" className="text-xs">{r.format}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Último: {lastDate
                        ? new Date(lastDate).toLocaleDateString('pt-BR') + ' ' + new Date(lastDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : new Date(r.lastGenerated).toLocaleDateString('pt-BR')}
                    </div>
                    <Button
                      className="mt-3 w-full"
                      variant="outline"
                      size="sm"
                      disabled={isLoading || (!!loadingId && loadingId !== r.id)}
                      onClick={() => handleGenerate(r.id)}
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" /> Gerar Relatório</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Relatórios Automatizados</p>
          <p className="text-sm mt-1">
            {hasRealData
              ? 'Com dados reais disponíveis, os relatórios são gerados com informações atualizadas do banco de dados.'
              : 'Após a integração com as APIs de coleta, os relatórios serão gerados automaticamente com dados reais.'}
          </p>
        </CardContent>
      </Card>

      <SelectEventReportDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        entityId={principalEntity?.id}
        loading={loadingId === "3"}
        onSelect={handleEventSelect}
      />
    </div>
  );
};

export default Reports;
