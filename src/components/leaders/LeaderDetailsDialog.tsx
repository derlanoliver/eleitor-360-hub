import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, Users, Calendar, MessageSquare, Trophy, History, 
  MapPin, Phone, Mail, CheckCircle, Clock, AlertCircle,
  MessageCircle, Send, Eye, XCircle, Globe, ExternalLink, ClipboardList,
  Download, Crown, Star, ChevronDown, GitBranch, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { OfficeLeader } from "@/types/office";
import { useLeaderIndicatedContacts } from "@/hooks/leaders/useLeaderIndicatedContacts";
import { useLeaderSubordinates } from "@/hooks/leaders/useLeaderSubordinates";
import { useLeaderEventParticipation } from "@/hooks/leaders/useLeaderEventParticipation";
import { useLeaderCommunications } from "@/hooks/leaders/useLeaderCommunications";
import { useLeaderVisits } from "@/hooks/leaders/useLeaderVisits";
import { useLeaderPageViews } from "@/hooks/leaders/useLeaderPageViews";
import { useLeaderSurveyReferrals } from "@/hooks/leaders/useLeaderSurveyReferrals";
import { LeaderLevelBadge, LeaderLevelProgress } from "@/components/leaders/LeaderLevelBadge";
import { 
  useLeaderLevels, 
  useGamificationSettings,
  getLeaderLevel,
  getNextLevel,
  getPointsToNextLevel,
  DEFAULT_LEVELS
} from "@/hooks/leaders/useLeaderLevels";
import { useLeaderHierarchyPath } from "@/hooks/leaders/useLeaderHierarchyPath";

interface LeaderDetailsDialogProps {
  leader: OfficeLeader;
  children: React.ReactNode;
}

const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

const formatDate = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

const formatDateTime = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const whatsappStatusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  pending: { icon: <Clock className="h-3 w-3" />, label: "Pendente", className: "text-muted-foreground" },
  sent: { icon: <CheckCircle className="h-3 w-3" />, label: "Enviado", className: "text-gray-500" },
  delivered: { icon: <CheckCircle className="h-3 w-3" />, label: "Entregue", className: "text-green-600" },
  read: { icon: <Eye className="h-3 w-3" />, label: "Lido", className: "text-blue-600" },
  failed: { icon: <XCircle className="h-3 w-3" />, label: "Falhou", className: "text-red-600" },
};

const visitStatusLabels: Record<string, string> = {
  REGISTERED: "Registrado",
  LINK_SENT: "Link Enviado",
  FORM_OPENED: "Form Aberto",
  FORM_SUBMITTED: "Form Enviado",
  CHECKED_IN: "Check-in Feito",
  CANCELLED: "Cancelado",
  MEETING_COMPLETED: "Reunião Concluída",
  RESCHEDULED: "Reagendado",
};

export function LeaderDetailsDialog({ leader, children }: LeaderDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [includeAllLevels, setIncludeAllLevels] = useState(true);
  
  const { data: indicatedContacts, isLoading: loadingContacts } = useLeaderIndicatedContacts(open ? leader.id : undefined);
  const { data: subordinates, isLoading: loadingSubordinates } = useLeaderSubordinates(open ? leader.id : undefined);
  const { indicatedEvents, ownEvents, isLoading: loadingEvents } = useLeaderEventParticipation(
    open ? leader.id : undefined, 
    open ? leader.telefone : undefined,
    open ? leader.email : undefined
  );
  const { whatsappMessages, emailLogs, smsMessages, isLoading: loadingComms } = useLeaderCommunications(
    open ? leader.id : undefined,
    open ? leader.telefone : undefined,
    open ? leader.email : undefined
  );
  const { data: visits, isLoading: loadingVisits } = useLeaderVisits(open ? leader.id : undefined);
  const { data: pageViews, isLoading: loadingPageViews } = useLeaderPageViews(open ? leader.id : undefined);
  const { data: surveyData, isLoading: loadingSurveys } = useLeaderSurveyReferrals(open ? leader.id : undefined);
  const { data: hierarchyPath, isLoading: loadingHierarchy } = useLeaderHierarchyPath(open ? leader.id : undefined);
  
  // Buscar níveis e configurações dinâmicas do banco
  const { data: dynamicLevels } = useLeaderLevels();
  const { data: gamificationSettings } = useGamificationSettings();
  
  // Usar níveis dinâmicos ou fallback para padrão
  const activeLevels = dynamicLevels || DEFAULT_LEVELS;
  
  const levelInfo = getLeaderLevel(leader.pontuacao_total, activeLevels);
  const nextLevel = getNextLevel(leader.pontuacao_total, activeLevels);
  const pointsToNext = getPointsToNextLevel(leader.pontuacao_total, activeLevels);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            {leader.nome_completo}
            <LeaderLevelBadge points={leader.pontuacao_total} levels={activeLevels} size="sm" />
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
            <TabsTrigger value="indicacoes" className="text-xs">Indicações</TabsTrigger>
            <TabsTrigger value="eventos" className="text-xs">Eventos</TabsTrigger>
            <TabsTrigger value="pesquisas" className="text-xs">Pesquisas</TabsTrigger>
            <TabsTrigger value="comunicacoes" className="text-xs">Comunicações</TabsTrigger>
            <TabsTrigger value="pontuacao" className="text-xs">Pontuação</TabsTrigger>
            <TabsTrigger value="arvore" className="text-xs">Árvore</TabsTrigger>
            <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-180px)] mt-4">
            {/* ABA INFO */}
            <TabsContent value="info" className="mt-0 space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {leader.email || "Não informado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {leader.telefone ? formatPhone(leader.telefone) : "Não informado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Região</p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {leader.cidade?.nome || "Não informada"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                  <p>{leader.data_nascimento ? formatDate(leader.data_nascimento) : "Não informada"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cadastro</p>
                  <p>{formatDate(leader.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Última Atividade</p>
                  <p>{leader.last_activity ? formatDateTime(leader.last_activity) : "Sem atividade"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={leader.is_active ? "default" : "secondary"}>
                    {leader.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Token de Afiliado</p>
                  <p className="font-mono text-sm">{leader.affiliate_token || "Não gerado"}</p>
                </div>
              </div>
              {leader.observacao && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{leader.observacao}</p>
                </div>
              )}
            </TabsContent>

            {/* ABA INDICAÇÕES */}
            <TabsContent value="indicacoes" className="mt-0 space-y-4 pr-4">
              {/* Header com total combinado */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-medium">Total de Indicações</h4>
                <Badge variant="default" className="text-sm">
                  {(indicatedContacts?.length || 0) + (subordinates?.length || 0)} indicações
                </Badge>
              </div>

              {/* Botões de Exportação */}
              <div className="flex flex-wrap gap-2">
                {/* Botão Todos */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const allContacts = indicatedContacts || [];
                    const allLeaders = subordinates || [];
                    const totalRecords = allContacts.length + allLeaders.length;
                    
                    if (totalRecords === 0) {
                      toast.info("Nenhum registro para exportar.");
                      return;
                    }
                    
                    const headers = ['Nome', 'Telefone', 'Email', 'Região', 'Tipo', 'Status', 'Data Cadastro'];
                    
                    const contactRows = allContacts.map(c => [
                      c.nome,
                      formatPhone(c.telefone_norm),
                      c.email || '',
                      c.cidade?.nome || '',
                      'Contato',
                      c.is_verified ? 'Verificado' : 'Pendente',
                      formatDate(c.created_at)
                    ]);
                    
                    const leaderRows = allLeaders.map(l => [
                      l.nome_completo,
                      l.telefone ? formatPhone(l.telefone) : '',
                      l.email || '',
                      l.cidade?.nome || '',
                      'Líder',
                      'Verificado',
                      formatDate(l.created_at)
                    ]);
                    
                    const allRows = [...contactRows, ...leaderRows];
                    const csv = [headers, ...allRows].map(row => row.join(';')).join('\n');
                    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${leader.nome_completo}_todos.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success(`${totalRecords} registros exportados (${allContacts.length} contatos + ${allLeaders.length} líderes).`);
                  }}
                  disabled={!((indicatedContacts && indicatedContacts.length > 0) || (subordinates && subordinates.length > 0))}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Todos ({(indicatedContacts?.length || 0) + (subordinates?.length || 0)})
                </Button>

                {/* Botão Verificados */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const verifiedContacts = indicatedContacts?.filter(c => c.is_verified) || [];
                    const leaderSubordinates = subordinates || [];
                    const totalVerified = verifiedContacts.length + leaderSubordinates.length;
                    
                    if (totalVerified === 0) {
                      toast.info("Nenhum registro verificado para exportar.");
                      return;
                    }
                    
                    const headers = ['Nome', 'Telefone', 'Email', 'Região', 'Tipo', 'Data Cadastro', 'Data Verificação'];
                    
                    const contactRows = verifiedContacts.map(c => [
                      c.nome,
                      formatPhone(c.telefone_norm),
                      c.email || '',
                      c.cidade?.nome || '',
                      'Contato',
                      formatDate(c.created_at),
                      c.verified_at ? formatDate(c.verified_at) : ''
                    ]);
                    
                    const leaderRows = leaderSubordinates.map(l => [
                      l.nome_completo,
                      l.telefone ? formatPhone(l.telefone) : '',
                      l.email || '',
                      l.cidade?.nome || '',
                      'Líder',
                      formatDate(l.created_at),
                      formatDate(l.created_at)
                    ]);
                    
                    const allRows = [...contactRows, ...leaderRows];
                    const csv = [headers, ...allRows].map(row => row.join(';')).join('\n');
                    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${leader.nome_completo}_verificados.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success(`${totalVerified} registros exportados (${verifiedContacts.length} contatos + ${leaderSubordinates.length} líderes).`);
                  }}
                  disabled={!(indicatedContacts?.some(c => c.is_verified) || (subordinates && subordinates.length > 0))}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Verificados ({(indicatedContacts?.filter(c => c.is_verified).length || 0) + (subordinates?.length || 0)})
                </Button>

                {/* Botão Pendentes */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const pending = indicatedContacts?.filter(c => !c.is_verified) || [];
                    if (pending.length === 0) {
                      toast.info("Nenhum contato pendente para exportar.");
                      return;
                    }
                    const headers = ['Nome', 'Telefone', 'Email', 'Região', 'Tipo', 'Data Cadastro'];
                    const rows = pending.map(c => [
                      c.nome,
                      formatPhone(c.telefone_norm),
                      c.email || '',
                      c.cidade?.nome || '',
                      'Contato',
                      formatDate(c.created_at)
                    ]);
                    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
                    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${leader.nome_completo}_pendentes.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success(`${pending.length} contatos pendentes exportados.`);
                  }}
                  disabled={!indicatedContacts?.some(c => !c.is_verified)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Pendentes ({indicatedContacts?.filter(c => !c.is_verified).length || 0})
                </Button>
              </div>

              {/* Seção: Líderes Indicados (Subordinados) */}
              {(loadingSubordinates || (subordinates && subordinates.length > 0)) && (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <h5 className="font-medium text-sm">Líderes Indicados</h5>
                    </div>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0">
                      {subordinates?.length || 0} líderes
                    </Badge>
                  </div>
                  
                  {loadingSubordinates ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : (
                    <div className="space-y-2">
                      {subordinates?.map((sub) => (
                        <Card key={sub.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{sub.nome_completo}</p>
                                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Líder
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {sub.cidade?.nome || "Sem região"} • {formatDate(sub.created_at)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {sub.cadastros} cadastros
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {sub.pontuacao_total} pontos
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {sub.is_active ? (
                                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-0">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Inativo</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Seção: Contatos Indicados */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <h5 className="font-medium text-sm">Contatos Indicados</h5>
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-0">
                  {indicatedContacts?.length || 0} contatos
                </Badge>
              </div>
              
              {loadingContacts ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !indicatedContacts?.length ? (
                <p className="text-sm text-muted-foreground">Nenhum contato indicado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {indicatedContacts.map((contact) => (
                    <Card key={contact.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{contact.nome}</p>
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                <User className="h-3 w-3 mr-1" />
                                Contato
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {contact.cidade?.nome || "Sem região"} • {formatDate(contact.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {contact.is_verified ? (
                              <Badge variant="default" className="bg-green-500/10 text-green-600 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verificado
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                            {!contact.is_active && (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Visitas criadas pelo líder */}
              {visits && visits.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-6">
                    <h4 className="font-medium">Visitas Agendadas</h4>
                    <Badge variant="secondary">{visits.length} visitas</Badge>
                  </div>
                  <div className="space-y-2">
                    {visits.map((visit) => (
                      <Card key={visit.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{visit.contact?.nome || "Contato"}</p>
                              <p className="text-sm text-muted-foreground">
                                {visit.protocolo} • {visit.city?.nome}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {visitStatusLabels[visit.status] || visit.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(visit.created_at)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ABA EVENTOS */}
            <TabsContent value="eventos" className="mt-0 space-y-4 pr-4">
              {/* Eventos próprios */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Eventos Participados</h4>
                <Badge variant="secondary">{ownEvents.length} eventos</Badge>
              </div>
              
              {loadingEvents ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !ownEvents.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma participação em eventos.</p>
              ) : (
                <div className="space-y-2">
                  {ownEvents.map((reg) => (
                    <Card key={reg.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{reg.event?.name || "Evento"}</p>
                            <p className="text-sm text-muted-foreground">
                              {reg.event?.date ? formatDate(reg.event.date) : ""} às {reg.event?.time?.slice(0, 5)} • {reg.event?.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {reg.checked_in ? (
                              <Badge className="bg-green-500/10 text-green-600 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Check-in
                              </Badge>
                            ) : (
                              <Badge variant="outline">Inscrito</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Indicações em eventos */}
              {indicatedEvents.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-6">
                    <h4 className="font-medium">Indicações em Eventos</h4>
                    <Badge variant="secondary">{indicatedEvents.length} indicações</Badge>
                  </div>
                  <div className="space-y-2">
                    {indicatedEvents.map((reg) => (
                      <Card key={reg.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{reg.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {reg.event?.name} • {reg.event?.date ? formatDate(reg.event.date) : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {reg.checked_in ? (
                                <Badge className="bg-green-500/10 text-green-600 border-0">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Check-in
                                </Badge>
                              ) : (
                                <Badge variant="outline">Inscrito</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ABA PESQUISAS */}
            <TabsContent value="pesquisas" className="mt-0 space-y-4 pr-4">
              {/* Pesquisas respondidas pelo líder */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Pesquisas Respondidas
                </h4>
                <Badge variant="secondary">{surveyData?.ownResponses?.length || 0} respostas</Badge>
              </div>
              
              {loadingSurveys ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !surveyData?.ownResponses?.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma pesquisa respondida ainda.</p>
              ) : (
                <div className="space-y-2">
                  {surveyData.ownResponses.map((response) => (
                    <Card key={response.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{response.survey?.titulo || "Pesquisa"}</p>
                            <p className="text-sm text-muted-foreground">
                              Respondida em {formatDateTime(response.created_at)}
                            </p>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Respondida
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Indicações de pesquisa */}
              {surveyData?.referredResponses && surveyData.referredResponses.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-6">
                    <h4 className="font-medium">Indicações em Pesquisas</h4>
                    <Badge variant="secondary">{surveyData.referredResponses.length} indicações</Badge>
                  </div>
                  <div className="space-y-2">
                    {surveyData.referredResponses.map((response) => (
                      <Card key={response.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{response.contact?.nome || "Contato"}</p>
                              <p className="text-sm text-muted-foreground">
                                {response.survey?.titulo} • {formatDateTime(response.created_at)}
                              </p>
                            </div>
                            <Badge variant="outline">
                              +2 pts
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ABA COMUNICAÇÕES */}
            <TabsContent value="comunicacoes" className="mt-0 space-y-4 pr-4">
              {/* WhatsApp */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </h4>
                <Badge variant="secondary">{whatsappMessages.length} mensagens</Badge>
              </div>
              
              {loadingComms ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !whatsappMessages.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma mensagem WhatsApp.</p>
              ) : (
                <div className="space-y-2">
                  {whatsappMessages.slice(0, 10).map((msg) => {
                    const statusInfo = whatsappStatusConfig[msg.status] || whatsappStatusConfig.pending;
                    return (
                      <Card key={msg.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {msg.direction === 'outgoing' ? (
                                  <Send className="h-3 w-3 text-blue-600" />
                                ) : (
                                  <MessageSquare className="h-3 w-3 text-green-600" />
                                )}
                                <span className={`flex items-center gap-1 text-xs ${statusInfo.className}`}>
                                  {statusInfo.icon}
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(msg.created_at)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* SMS */}
              <div className="flex items-center justify-between mt-6">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  SMS
                </h4>
                <Badge variant="secondary">{smsMessages.length} mensagens</Badge>
              </div>
              
              {!smsMessages.length ? (
                <p className="text-sm text-muted-foreground">Nenhum SMS enviado.</p>
              ) : (
                <div className="space-y-2">
                  {smsMessages.slice(0, 10).map((sms) => {
                    const statusInfo = whatsappStatusConfig[sms.status] || whatsappStatusConfig.pending;
                    return (
                      <Card key={sms.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Send className="h-3 w-3 text-purple-600" />
                                <span className={`flex items-center gap-1 text-xs ${statusInfo.className}`}>
                                  {statusInfo.icon}
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{sms.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(sms.created_at)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Email */}
              <div className="flex items-center justify-between mt-6">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email
                </h4>
                <Badge variant="secondary">{emailLogs.length} emails</Badge>
              </div>
              
              {!emailLogs.length ? (
                <p className="text-sm text-muted-foreground">Nenhum email enviado.</p>
              ) : (
                <div className="space-y-2">
                  {emailLogs.slice(0, 10).map((email) => (
                    <Card key={email.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{email.subject}</p>
                            <p className="text-xs text-muted-foreground">{email.to_email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={email.status === 'sent' ? 'text-green-600' : email.status === 'failed' ? 'text-red-600' : ''}
                            >
                              {email.status === 'sent' ? 'Enviado' : email.status === 'failed' ? 'Falhou' : 'Pendente'}
                            </Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(email.created_at)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ABA PONTUAÇÃO */}
            <TabsContent value="pontuacao" className="mt-0 space-y-4 pr-4">
              <div className="text-center p-6 bg-muted rounded-lg">
                <div className="text-5xl mb-2">{levelInfo.icon}</div>
                <h3 className="text-2xl font-bold">{levelInfo.name}</h3>
                <p className="text-3xl font-bold text-primary mt-2">{leader.pontuacao_total} pontos</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso para próximo nível</span>
                  <span className="font-medium">{nextLevel ? `${pointsToNext} pts restantes` : 'Nível máximo!'}</span>
                </div>
                <LeaderLevelProgress points={leader.pontuacao_total} levels={activeLevels} />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{(leader.cadastros || 0) + (subordinates?.length || 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Indicações</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{(indicatedContacts?.filter(c => c.is_verified).length || 0) + (subordinates?.length || 0)}</p>
                    <p className="text-sm text-muted-foreground">Verificados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{subordinates?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Líderes Indicados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{indicatedEvents.length}</p>
                    <p className="text-sm text-muted-foreground">Indicações em Eventos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{visits?.filter(v => v.checked_in).length || 0}</p>
                    <p className="text-sm text-muted-foreground">Check-ins de Visitas</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Como ganhar pontos:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• +{gamificationSettings?.pontos_form_submitted || 1} ponto por contato indicado verificado</li>
                  <li>• +{gamificationSettings?.pontos_form_submitted || 1} ponto por inscrição em evento</li>
                  <li>• +2 pontos por check-in em evento</li>
                  <li>• +2 pontos por check-in de visita indicada</li>
                  <li>• +2 pontos por download de material indicado</li>
                  <li>• +1 ponto por responder uma pesquisa</li>
                  <li>• +2 pontos por indicação que responde pesquisa</li>
                </ul>
              </div>
            </TabsContent>

            {/* ABA ÁRVORE */}
            <TabsContent value="arvore" className="mt-0 space-y-4 pr-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium">Hierarquia de Liderança</h4>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Checkbox para filtrar níveis no relatório */}
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="include-all-levels"
                      checked={includeAllLevels}
                      onCheckedChange={(checked) => setIncludeAllLevels(checked === true)}
                    />
                    <Label htmlFor="include-all-levels" className="text-sm text-muted-foreground cursor-pointer">
                      Incluir todos os níveis
                    </Label>
                  </div>
                  
                  {/* Botão de Relatório de Pendentes */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingReport}
                  onClick={async () => {
                    setLoadingReport(true);
                    try {
                      // 1. Buscar toda a árvore de líderes subordinados
                      const { data: treeData, error: treeError } = await supabase
                        .rpc("get_leader_tree", { _leader_id: leader.id });
                      
                      if (treeError) throw treeError;
                      
                      // Filtrar apenas líderes ativos (excluir desativados do relatório)
                      const leaders = (treeData || []).filter((l: any) => l.is_active === true);
                      const leaderIds = leaders.map((l: any) => l.id);
                      
                      if (leaderIds.length === 0) {
                        toast.info("Nenhum líder encontrado na árvore.");
                        setLoadingReport(false);
                        return;
                      }

                      // 2. Dividir leaderIds em chunks para evitar Bad Request (URL muito longa)
                      const chunkSize = 200;
                      const leaderIdChunks: string[][] = [];
                      for (let i = 0; i < leaderIds.length; i += chunkSize) {
                        leaderIdChunks.push(leaderIds.slice(i, i + chunkSize));
                      }

                      // 3. Buscar contatos pendentes (não verificados) de todos os chunks
                      const allPendingContacts: any[] = [];
                      const pageSize = 1000;

                      for (const chunk of leaderIdChunks) {
                        let page = 0;
                        let hasMore = true;

                        while (hasMore) {
                          const from = page * pageSize;
                          const to = from + pageSize - 1;

                          const { data: contactsData, error: contactsError } = await supabase
                            .from("office_contacts")
                            .select(`
                              id, nome, telefone_norm, email, source_id, created_at,
                              cidade:office_cities(nome)
                            `)
                            .eq("source_type", "lider")
                            .in("source_id", chunk)
                            .eq("is_active", true)
                            .eq("is_verified", false)
                            .range(from, to);

                          if (contactsError) throw contactsError;

                          if (contactsData && contactsData.length > 0) {
                            allPendingContacts.push(...contactsData);
                            hasMore = contactsData.length === pageSize;
                            page++;
                          } else {
                            hasMore = false;
                          }
                        }
                      }

                      // 4. Criar mapa de líderes por ID para lookup
                      const leaderMap = new Map(leaders.map((l: any) => [l.id, l]));

                      // 5. Criar mapa de subordinados diretos por líder (para contagem de cadastros)
                      const subordinatesCount = new Map<string, number>();
                      leaders.forEach((l: any) => {
                        if (l.parent_leader_id) {
                          const count = subordinatesCount.get(l.parent_leader_id) || 0;
                          subordinatesCount.set(l.parent_leader_id, count + 1);
                        }
                      });

                      // 6. Gerar CSV
                      const headers = ['Tipo', 'Nome', 'Telefone', 'Email', 'Região', 'Nível', 'Líder Indicador', 'Data Cadastro', 'Cadastros'];
                      
                      // Função recursiva para ordenar hierarquicamente
                      const sortLeadersHierarchically = (allLeaders: any[], parentId: string): any[] => {
                        const result: any[] = [];
                        const children = allLeaders.filter((l: any) => l.parent_leader_id === parentId && l.id !== parentId);
                        
                        for (const child of children) {
                          result.push(child);
                          // Recursivamente adiciona os subordinados diretos
                          result.push(...sortLeadersHierarchically(allLeaders, child.id));
                        }
                        
                        return result;
                      };

                      // Ordenar líderes hierarquicamente começando pelo líder selecionado
                      const sortedLeaders = sortLeadersHierarchically(leaders, leader.id);

                      // Calcular totais para o cabeçalho do relatório (sempre da árvore completa)
                      const totalLeadersInTree = sortedLeaders.length;
                      const totalContactsPending = allPendingContacts.length;
                      const leaderDirectSubordinates = subordinatesCount.get(leader.id) || 0;
                      const leaderTotalCadastros = (leader.cadastros || 0) + leaderDirectSubordinates;

                      // Calcular o nível base para filtrar liderados diretos (usar hierarchy_level real)
                      const baseLevel = leader.hierarchy_level || 1;
                      const directSubordinateLevel = baseLevel + 1;

                      // Filtrar líderes para o relatório baseado na opção selecionada
                      const leadersForReport = includeAllLevels 
                        ? sortedLeaders 
                        : sortedLeaders.filter((l: any) => {
                            // Incluir apenas liderados diretos (um nível abaixo)
                            return l.hierarchy_level === directSubordinateLevel;
                          });

                      // IDs dos líderes que vão no relatório
                      const leaderIdsForReport = leadersForReport.map((l: any) => l.id);

                      // Filtrar contatos pendentes apenas dos líderes filtrados
                      const contactsForReport = includeAllLevels 
                        ? allPendingContacts 
                        : allPendingContacts.filter((c: any) => leaderIdsForReport.includes(c.source_id));

                      // Linhas de líderes (filtradas) com cadastros = contatos + subordinados
                      const leaderRows = leadersForReport.map((l: any) => {
                        const parentLeader = l.parent_leader_id ? leaderMap.get(l.parent_leader_id) : null;
                        const directSubordinates = subordinatesCount.get(l.id) || 0;
                        const totalCadastros = (l.cadastros || 0) + directSubordinates;
                        return [
                          l.is_coordinator ? 'Coordenador' : 'Líder',
                          l.nome_completo,
                          l.telefone || '',
                          l.email || '',
                          l.cidade_nome || '',
                          l.is_coordinator ? 'Coordenador' : `Nível ${(l.hierarchy_level || 1) - 1}`,
                          parentLeader ? (parentLeader as any).nome_completo : '',
                          l.created_at ? formatDate(l.created_at) : '',
                          String(totalCadastros)
                        ];
                      });

                      // Linhas de contatos pendentes (filtradas)
                      const contactRows = contactsForReport.map((c: any) => {
                        const indicatorLeader = leaderMap.get(c.source_id);
                        return [
                          'Contato Pendente',
                          c.nome,
                          c.telefone_norm || '',
                          c.email || '',
                          (c.cidade as any)?.nome || '',
                          '-',
                          indicatorLeader ? (indicatorLeader as any).nome_completo : '',
                          formatDate(c.created_at),
                          '0'
                        ];
                      });

                      const allRows = [...leaderRows, ...contactRows];

                      // Linha informativa se não houver dados na listagem
                      const dataRows = allRows.length > 0 
                        ? allRows 
                        : [['', 'Nenhum líder subordinado ou contato pendente encontrado', '', '', '', '', '', '', '']];

                      // 7. Criar cabeçalho do relatório com totais e filtro aplicado
                      const filterLabel = includeAllLevels ? 'Todos os níveis' : 'Apenas liderados diretos';
                      const listingLabel = includeAllLevels ? 'COMPLETA' : 'LIDERADOS DIRETOS';
                      const reportHeader = [
                        [`RELATÓRIO DE ÁRVORE - ${leader.nome_completo}`],
                        [`Gerado em: ${formatDateTime(new Date().toISOString())}`],
                        [`Filtro: ${filterLabel}`],
                        [''],
                        ['RESUMO (ÁRVORE COMPLETA):'],
                        [`Total de Líderes na Árvore: ${totalLeadersInTree}`],
                        [`Total de Contatos Pendentes: ${totalContactsPending}`],
                        [`Cadastros do ${leader.is_coordinator ? 'Coordenador' : 'Líder'}: ${leaderTotalCadastros}`],
                        [''],
                        [`LISTAGEM (${listingLabel}): ${leaderRows.length} líderes + ${contactRows.length} contatos pendentes`],
                        ['']
                      ];

                      // 8. Exportar CSV com cabeçalho
                      const csv = [...reportHeader.map(row => row.join(';')), headers.join(';'), ...dataRows.map(row => row.join(';'))].join('\n');
                      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${leader.nome_completo}_arvore_pendentes.csv`;
                      link.click();
                      URL.revokeObjectURL(url);
                      
                      toast.success(`Relatório exportado: ${leaderRows.length} líderes + ${contactRows.length} contatos pendentes`);
                    } catch (error) {
                      console.error('Erro ao gerar relatório:', error);
                      toast.error("Erro ao gerar relatório.");
                    } finally {
                      setLoadingReport(false);
                    }
                  }}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {loadingReport ? "Gerando..." : "Relatório Pendentes"}
                  </Button>
                </div>
              </div>

              {loadingHierarchy ? (
                <p className="text-sm text-muted-foreground">Carregando hierarquia...</p>
              ) : leader.is_coordinator ? (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                        <Crown className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Este líder é um Coordenador</p>
                        <p className="text-sm text-muted-foreground">
                          Coordenadores são a raiz da árvore hierárquica
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : !hierarchyPath || hierarchyPath.length === 0 || !hierarchyPath[0]?.hierarchy_level ? (
                <Card className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted text-muted-foreground">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Sem vínculo hierárquico</p>
                        <p className="text-sm text-muted-foreground">
                          Este líder não está vinculado a nenhuma árvore hierárquica
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {hierarchyPath.map((node, index) => {
                    const isCurrentLeader = node.id === leader.id;
                    const isCoordinator = node.is_coordinator;
                    
                    return (
                      <div key={node.id}>
                        {/* Conector */}
                        {index > 0 && (
                          <div className="flex justify-center py-1">
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Card do nó */}
                        <Card className={`${isCurrentLeader ? 'border-primary ring-2 ring-primary/20' : ''} ${isCoordinator ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                isCoordinator 
                                  ? 'bg-amber-100 text-amber-600' 
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {isCoordinator ? (
                                  <Crown className="h-4 w-4" />
                                ) : (
                                  <Star className="h-4 w-4" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{node.nome_completo}</p>
                                  {isCurrentLeader && (
                                    <Badge variant="outline" className="text-xs border-primary text-primary">
                                      Você está aqui
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${isCoordinator ? 'bg-amber-100 text-amber-700' : ''}`}
                                  >
                                    {isCoordinator ? 'Coordenador' : `Nível ${(node.hierarchy_level || 1) - 1}`}
                                  </Badge>
                                  {node.cidade_nome && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {node.cidade_nome}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ABA HISTÓRICO */}
            <TabsContent value="historico" className="mt-0 space-y-4 pr-4">
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Líder cadastrado</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(leader.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {leader.last_activity && leader.last_activity !== leader.created_at && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                          <History className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Última atividade</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(leader.last_activity)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!leader.is_active && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-100 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Líder desativado</p>
                          <p className="text-sm text-muted-foreground">Status alterado para inativo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline de atividades recentes */}
                {indicatedContacts && indicatedContacts.slice(0, 5).map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Indicou {contact.nome}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(contact.created_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Páginas Acessadas por Indicações */}
              {pageViews && pageViews.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Páginas Acessadas (Indicações)
                    </h4>
                    <Badge variant="secondary">{pageViews.length} acessos</Badge>
                  </div>
                  
                  {loadingPageViews ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : (
                    <div className="space-y-2">
                      {pageViews.slice(0, 10).map((view) => (
                        <Card key={view.id}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{view.contact_name}</span>
                                </div>
                                <p className="font-medium text-sm">{view.page_name || "Formulário"}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[350px]">
                                  {view.page_identifier}
                                </p>
                                {view.utm_source && (
                                  <div className="flex gap-1 mt-1">
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                      {view.utm_source}
                                    </Badge>
                                    {view.utm_campaign && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        {view.utm_campaign}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDateTime(view.created_at)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
