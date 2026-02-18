import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REPORT_TEMPLATES } from "@/data/public-opinion/demoPublicOpinionData";
import { FileText, Download, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  sob_demanda: 'Sob Demanda',
};

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 mt-1">Gere e baixe relatórios de opinião pública para tomada de decisão</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TEMPLATES.map((r) => (
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
                    Último: {new Date(r.lastGenerated).toLocaleDateString('pt-BR')}
                  </div>
                  <Button
                    className="mt-3 w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Funcionalidade disponível após integração com APIs de coleta")}
                  >
                    <Download className="h-4 w-4 mr-2" /> Gerar Relatório
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Relatórios Automatizados</p>
          <p className="text-sm mt-1">Após a integração com as APIs de coleta (Zenscrape e Datastream), os relatórios serão gerados automaticamente com dados reais.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
