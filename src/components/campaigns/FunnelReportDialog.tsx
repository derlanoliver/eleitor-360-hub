import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Users, Download, TrendingUp, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadFunnel } from "@/hooks/campaigns/useLeadFunnels";
import { supabase } from "@/integrations/supabase/client";

interface FunnelReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel: LeadFunnel;
}

export function FunnelReportDialog({ open, onOpenChange, funnel }: FunnelReportDialogProps) {
  // Fetch leads captured by this funnel
  const { data: leads, isLoading } = useQuery({
    queryKey: ['funnel_leads', funnel.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_contacts')
        .select(`
          id,
          nome,
          email,
          telefone_norm,
          created_at,
          cidade:office_cities(nome)
        `)
        .eq('source_type', 'captacao')
        .eq('source_id', funnel.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const conversionRate = funnel.views_count > 0 
    ? ((funnel.leads_count / funnel.views_count) * 100).toFixed(1) 
    : '0';

  const downloadRate = funnel.leads_count > 0
    ? ((funnel.downloads_count / funnel.leads_count) * 100).toFixed(1)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório: {funnel.nome}</DialogTitle>
        </DialogHeader>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-xs">Visitas</span>
              </div>
              <p className="text-2xl font-bold">{funnel.views_count}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Leads</span>
              </div>
              <p className="text-2xl font-bold">{funnel.leads_count}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Download className="h-4 w-4" />
                <span className="text-xs">Downloads</span>
              </div>
              <p className="text-2xl font-bold">{funnel.downloads_count}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Conversão</span>
              </div>
              <p className="text-2xl font-bold">{conversionRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground">Visitas</div>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                    style={{ width: '100%' }}
                  >
                    {funnel.views_count}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground">Leads</div>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                    style={{ width: `${funnel.views_count > 0 ? (funnel.leads_count / funnel.views_count) * 100 : 0}%`, minWidth: funnel.leads_count > 0 ? '40px' : '0' }}
                  >
                    {funnel.leads_count}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-12">{conversionRate}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground">Downloads</div>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                    style={{ width: `${funnel.views_count > 0 ? (funnel.downloads_count / funnel.views_count) * 100 : 0}%`, minWidth: funnel.downloads_count > 0 ? '40px' : '0' }}
                  >
                    {funnel.downloads_count}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-12">{downloadRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leads Capturados ({leads?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leads && leads.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.nome}</TableCell>
                        <TableCell>{lead.email || '-'}</TableCell>
                        <TableCell>{lead.telefone_norm || '-'}</TableCell>
                        <TableCell>{(lead.cidade as any)?.nome || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lead capturado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
