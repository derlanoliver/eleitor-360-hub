import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Users,
  Calendar,
  Target,
  UserCheck,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useWhatsAppTemplates,
  replaceTemplateVariables,
} from "@/hooks/useWhatsAppTemplates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getBaseUrl } from "@/lib/urlHelper";

type RecipientType = "leaders" | "event_contacts" | "funnel_contacts" | "all_contacts";

// Templates que precisam de evento destino
const EVENT_INVITE_TEMPLATES = ["evento-convite"];
// Templates que precisam de funil destino
const FUNNEL_INVITE_TEMPLATES = ["captacao-convite"];

// Templates de convite permitidos por tipo de destinatário
const CONVITE_TEMPLATES_LEADERS = [
  "evento-convite",
  "captacao-convite",
];

const CONVITE_TEMPLATES_CONTACTS = [
  "evento-convite",
  "captacao-convite",
];

export function WhatsAppBulkSendTab() {
  const [recipientType, setRecipientType] = useState<RecipientType>("all_contacts");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedFunnel, setSelectedFunnel] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  
  // Estados para evento/funil DESTINO (para preencher variáveis)
  const [targetEventId, setTargetEventId] = useState("");
  const [targetFunnelId, setTargetFunnelId] = useState("");

  // Delay aleatório entre 3-6 segundos para parecer mais humano e evitar bloqueio
  const getRandomDelay = () => {
    const minDelay = 3000; // 3 segundos
    const maxDelay = 6000; // 6 segundos
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  };

  const { data: templates } = useWhatsAppTemplates();

  // Detectar tipo do template selecionado
  const selectedTemplateData = templates?.find((t) => t.id === selectedTemplate);
  const isEventInviteTemplate = selectedTemplateData && EVENT_INVITE_TEMPLATES.includes(selectedTemplateData.slug);
  const isFunnelInviteTemplate = selectedTemplateData && FUNNEL_INVITE_TEMPLATES.includes(selectedTemplateData.slug);

  // Fetch events
  const { data: events } = useQuery({
    queryKey: ["events-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug, date, time, location, address, description, status")
        .eq("status", "active")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch funnels
  const { data: funnels } = useQuery({
    queryKey: ["funnels-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_funnels")
        .select("id, nome, slug, lead_magnet_nome, descricao")
        .eq("status", "active")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch target event details (para preencher variáveis)
  const { data: targetEvent } = useQuery({
    queryKey: ["target_event_whatsapp", targetEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug, date, time, location, address, description")
        .eq("id", targetEventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!targetEventId && !!isEventInviteTemplate,
  });

  // Fetch target funnel details (para preencher variáveis)
  const { data: targetFunnel } = useQuery({
    queryKey: ["target_funnel_whatsapp", targetFunnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_funnels")
        .select("id, nome, slug, lead_magnet_nome, descricao, subtitulo")
        .eq("id", targetFunnelId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!targetFunnelId && !!isFunnelInviteTemplate,
  });

  // Fetch recipients count based on selection
  const { data: recipientsData, isLoading: recipientsLoading } = useQuery({
    queryKey: ["whatsapp-recipients", recipientType, selectedEvent, selectedFunnel],
    queryFn: async () => {
      if (recipientType === "leaders") {
        const { data, error } = await supabase
          .from("lideres")
          .select("id, nome_completo, telefone")
          .eq("is_active", true)
          .not("telefone", "is", null);
        if (error) throw error;
        return { count: data?.length || 0, recipients: data || [] };
      }

      if (recipientType === "event_contacts" && selectedEvent) {
        const { data, error } = await supabase
          .from("event_registrations")
          .select("id, nome, whatsapp, contact_id")
          .eq("event_id", selectedEvent);
        if (error) throw error;
        return { count: data?.length || 0, recipients: data || [] };
      }

      if (recipientType === "funnel_contacts" && selectedFunnel) {
        const { data, error } = await supabase
          .from("office_contacts")
          .select("id, nome, telefone_norm")
          .eq("source_type", "captacao")
          .eq("source_id", selectedFunnel)
          .not("telefone_norm", "is", null);
        if (error) throw error;
        return { count: data?.length || 0, recipients: data || [] };
      }

      if (recipientType === "all_contacts") {
        const { data, error } = await supabase
          .from("office_contacts")
          .select("id, nome, telefone_norm")
          .not("telefone_norm", "is", null);
        if (error) throw error;
        return { count: data?.length || 0, recipients: data || [] };
      }

      return { count: 0, recipients: [] };
    },
    enabled:
      recipientType === "leaders" ||
      recipientType === "all_contacts" ||
      (recipientType === "event_contacts" && !!selectedEvent) ||
      (recipientType === "funnel_contacts" && !!selectedFunnel),
  });

  // Filter templates based on recipient type - only invitation templates
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    const activeTemplates = templates.filter((t) => t.is_active);

    if (recipientType === "leaders") {
      return activeTemplates.filter((t) => CONVITE_TEMPLATES_LEADERS.includes(t.slug));
    }

    return activeTemplates.filter((t) => CONVITE_TEMPLATES_CONTACTS.includes(t.slug));
  }, [templates, recipientType]);

  const canSend =
    selectedTemplate &&
    recipientsData &&
    recipientsData.count > 0 &&
    (recipientType === "leaders" ||
      recipientType === "all_contacts" ||
      (recipientType === "event_contacts" && selectedEvent) ||
      (recipientType === "funnel_contacts" && selectedFunnel)) &&
    (!isEventInviteTemplate || targetEventId) &&
    (!isFunnelInviteTemplate || targetFunnelId);

  const handleSend = async () => {
    if (!canSend || !selectedTemplateData) return;

    setIsSending(true);
    let successCount = 0;
    let errorCount = 0;

    const baseUrl = getBaseUrl();

    try {
      const recipients = recipientsData.recipients as Record<string, unknown>[];
      const totalRecipients = recipients.length;
      setSendProgress({ current: 0, total: totalRecipients });

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        let phone: string | null = null;
        let nome: string = "Visitante";
        let contactId: string | null = null;

        if (recipientType === "leaders") {
          phone = recipient.telefone as string;
          nome = (recipient.nome_completo as string) || "Líder";
          contactId = null;
        } else if (recipientType === "event_contacts") {
          phone = recipient.whatsapp as string;
          nome = (recipient.nome as string) || "Visitante";
          contactId = (recipient.contact_id as string) || (recipient.id as string);
        } else {
          phone = recipient.telefone_norm as string;
          nome = (recipient.nome as string) || "Visitante";
          contactId = recipient.id as string;
        }

        if (!phone) continue;

        // Construir variáveis baseado no tipo de template
        const variables: Record<string, string> = {
          nome,
        };

        // Se for template de evento, adicionar variáveis do evento destino
        if (isEventInviteTemplate && targetEvent) {
          variables.evento_nome = targetEvent.name;
          variables.evento_data = format(new Date(targetEvent.date), "dd 'de' MMMM", { locale: ptBR });
          variables.evento_hora = targetEvent.time;
          variables.evento_local = targetEvent.location;
          variables.evento_endereco = targetEvent.address || "";
          variables.evento_descricao = targetEvent.description || "";
          variables.link_inscricao = `${baseUrl}/eventos/${targetEvent.slug}`;
        }

        // Se for template de captação, adicionar variáveis do funil destino
        if (isFunnelInviteTemplate && targetFunnel) {
          variables.material_nome = targetFunnel.lead_magnet_nome;
          variables.material_descricao = targetFunnel.subtitulo || "";
          variables.link_captacao = `${baseUrl}/captacao/${targetFunnel.slug}`;
        }

        const message = replaceTemplateVariables(selectedTemplateData.mensagem, variables);

        try {
          const { data, error } = await supabase.functions.invoke("send-whatsapp", {
            body: {
              phone,
              message,
              contactId,
            },
          });

          if (error || !data?.success) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
        }

        // Atualizar progresso
        setSendProgress({ current: i + 1, total: totalRecipients });

        // Delay aleatório entre 3-6 segundos (exceto na última mensagem)
        if (i < recipients.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} mensagens enviadas com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} mensagens falharam`);
      }
    } catch (error) {
      console.error("Erro no envio em massa:", error);
      toast.error("Erro ao processar envio em massa");
    } finally {
      setIsSending(false);
      setSendProgress({ current: 0, total: 0 });
    }
  };

  // Calcular tempo estimado em minutos (média de 4.5 segundos por mensagem)
  const estimatedMinutes = Math.ceil((recipientsData?.count || 0) * 4.5 / 60);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-1">
          <p>
            Certifique-se de que a integração Z-API está configurada e ativa antes de
            realizar envios em massa.
          </p>
          {(recipientsData?.count || 0) > 0 && (
            <p className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              Intervalo de 3-6 segundos entre mensagens para evitar bloqueios.
              {estimatedMinutes > 0 && (
                <span className="font-medium">
                  {" "}Tempo estimado: ~{estimatedMinutes} min
                </span>
              )}
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recipient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Destinatários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Destinatário</Label>
              <Select
                value={recipientType}
                onValueChange={(value) => {
                  setRecipientType(value as RecipientType);
                  setSelectedEvent("");
                  setSelectedFunnel("");
                  setSelectedTemplate("");
                  setTargetEventId("");
                  setTargetFunnelId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_contacts">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Todos os Contatos (com telefone)
                    </div>
                  </SelectItem>
                  <SelectItem value="leaders">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Líderes
                    </div>
                  </SelectItem>
                  <SelectItem value="event_contacts">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Contatos de Evento Específico
                    </div>
                  </SelectItem>
                  <SelectItem value="funnel_contacts">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Contatos de Funil de Captação
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === "event_contacts" && (
              <div className="space-y-2">
                <Label>Selecione o Evento (origem dos contatos)</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {recipientType === "funnel_contacts" && (
              <div className="space-y-2">
                <Label>Selecione o Funil (origem dos contatos)</Label>
                <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um funil" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels?.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Destinatários selecionados:
                </span>
                {recipientsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Badge variant="secondary">{recipientsData?.count || 0}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" />
              Template da Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione o Template</Label>
              <Select 
                value={selectedTemplate} 
                onValueChange={(v) => {
                  setSelectedTemplate(v);
                  setTargetEventId("");
                  setTargetFunnelId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um template" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DESTINO: Seleção do Evento para convite */}
            {isEventInviteTemplate && (
              <div className="space-y-2 p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                <Label className="text-primary font-medium">
                  Para qual evento deseja convidar?
                </Label>
                <Select value={targetEventId} onValueChange={setTargetEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento do convite" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.filter(e => e.status === "active").map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {targetEvent && (
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p>📅 {format(new Date(targetEvent.date), "dd/MM/yyyy")} às {targetEvent.time}</p>
                    <p>📍 {targetEvent.location}</p>
                  </div>
                )}
              </div>
            )}

            {/* DESTINO: Seleção do Funil/Material para convite */}
            {isFunnelInviteTemplate && (
              <div className="space-y-2 p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                <Label className="text-primary font-medium">
                  Para qual material deseja convidar?
                </Label>
                <Select value={targetFunnelId} onValueChange={setTargetFunnelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o material do convite" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels?.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.lead_magnet_nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {targetFunnel && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <p>📄 {targetFunnel.descricao || "Material de captação"}</p>
                  </div>
                )}
              </div>
            )}

            {selectedTemplateData && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <Label className="text-xs font-medium">Pré-visualização</Label>
                <div className="mt-2 p-2 bg-background rounded text-sm whitespace-pre-wrap">
                  {selectedTemplateData.mensagem}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplateData.variaveis.map((v, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary and Send Button */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Progress bar during sending */}
          {isSending && sendProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando mensagens...
                </span>
                <span className="font-medium">
                  {sendProgress.current} de {sendProgress.total}
                </span>
              </div>
              <Progress 
                value={(sendProgress.current / sendProgress.total) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Tempo restante estimado: ~{Math.ceil((sendProgress.total - sendProgress.current) * 4.5 / 60)} min
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                {recipientsData?.count || 0} destinatários selecionados
              </p>
              {isEventInviteTemplate && targetEvent && (
                <p className="text-sm font-medium">
                  Convite para: {targetEvent.name}
                </p>
              )}
              {isFunnelInviteTemplate && targetFunnel && (
                <p className="text-sm font-medium">
                  Convite para: {targetFunnel.lead_magnet_nome}
                </p>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleSend}
              disabled={!canSend || isSending}
              className="min-w-[200px]"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sendProgress.current}/{sendProgress.total}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para {recipientsData?.count || 0} destinatários
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
