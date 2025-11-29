import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Users, Target, CheckCircle2, XCircle } from "lucide-react";

interface CampaignReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignUtmCampaign: string;
  campaignName: string;
}

interface RegistrationData {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  cidade: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  leader_nome: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}

export default function CampaignReportDialog({
  open,
  onOpenChange,
  campaignUtmCampaign,
  campaignName,
}: CampaignReportDialogProps) {
  // Buscar visitantes (page_views)
  const { data: pageViews = 0 } = useQuery({
    queryKey: ["campaign_page_views", campaignUtmCampaign],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("utm_campaign", campaignUtmCampaign);

      if (error) throw error;
      return count || 0;
    },
    enabled: open && !!campaignUtmCampaign,
  });

  // Buscar cadastros (event_registrations)
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["campaign_registrations", campaignUtmCampaign],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          nome,
          email,
          whatsapp,
          checked_in,
          checked_in_at,
          created_at,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          cidade:office_cities(nome),
          leader:lideres(nome_completo)
        `)
        .eq("utm_campaign", campaignUtmCampaign)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((reg: any) => ({
        id: reg.id,
        nome: reg.nome,
        email: reg.email,
        whatsapp: reg.whatsapp,
        cidade: reg.cidade?.nome || null,
        checked_in: reg.checked_in || false,
        checked_in_at: reg.checked_in_at,
        created_at: reg.created_at,
        leader_nome: reg.leader?.nome_completo || null,
        utm_source: reg.utm_source,
        utm_medium: reg.utm_medium,
        utm_campaign: reg.utm_campaign,
        utm_content: reg.utm_content,
      })) as RegistrationData[];
    },
    enabled: open && !!campaignUtmCampaign,
  });

  const conversionRate = pageViews > 0 
    ? ((registrations.length / pageViews) * 100).toFixed(1) 
    : "0.0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório: {campaignName}</DialogTitle>
        </DialogHeader>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visitantes</p>
                  <p className="text-2xl font-bold text-purple-600">{pageViews}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cadastros</p>
                  <p className="text-2xl font-bold text-blue-600">{registrations.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check-ins</p>
                  <p className="text-2xl font-bold text-green-600">
                    {registrations.filter(r => r.checked_in).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversão</p>
                  <p className="text-2xl font-bold text-orange-600">{conversionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Cadastrados */}
        <div className="border rounded-lg">
          <div className="bg-muted px-4 py-3 rounded-t-lg">
            <h3 className="font-semibold">Cadastrados ({registrations.length})</h3>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum cadastro encontrado para esta campanha.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>UTM Source</TableHead>
                  <TableHead>UTM Medium</TableHead>
                  <TableHead>UTM Content</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.nome}</TableCell>
                    <TableCell className="text-sm">{reg.email}</TableCell>
                    <TableCell className="text-sm">{reg.whatsapp}</TableCell>
                    <TableCell className="text-sm">{reg.cidade || "-"}</TableCell>
                    <TableCell className="text-sm">{reg.leader_nome || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(reg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {reg.checked_in ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Não
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {reg.utm_source || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {reg.utm_medium || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {reg.utm_content || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
