import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Users, Calendar, Target, UserCheck, AlertTriangle } from "lucide-react";
import { useEmailTemplates, useSendBulkEmail } from "@/hooks/useEmailTemplates";
import { useEvents } from "@/hooks/events/useEvents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getBaseUrl } from "@/lib/urlHelper";

type RecipientType = "all_contacts" | "event_contacts" | "funnel_contacts" | "leaders";

// Templates que precisam de evento destino
const EVENT_INVITE_TEMPLATES = ["evento-convite-participar", "lideranca-evento-convite"];
// Templates que precisam de funil destino
const FUNNEL_INVITE_TEMPLATES = ["captacao-convite-material"];

export function EmailBulkSendTab() {
  const { data: templates, isLoading: loadingTemplates } = useEmailTemplates();
  const { data: events } = useEvents();
  const sendBulkEmail = useSendBulkEmail();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipientType, setRecipientType] = useState<RecipientType>("all_contacts");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedFunnel, setSelectedFunnel] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  // Estados para evento/funil DESTINO (para preencher variáveis)
  const [targetEventId, setTargetEventId] = useState("");
  const [targetFunnelId, setTargetFunnelId] = useState("");

  // Detectar tipo do template selecionado
  const isEventInviteTemplate = EVENT_INVITE_TEMPLATES.includes(selectedTemplate);
  const isFunnelInviteTemplate = FUNNEL_INVITE_TEMPLATES.includes(selectedTemplate);

  // Fetch funnels
  const { data: funnels } = useQuery({
    queryKey: ["lead_funnels_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_funnels")
        .select("id, nome, slug, lead_magnet_nome, descricao")
        .eq("status", "active")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch target event details (para preencher variáveis)
  const { data: targetEvent } = useQuery({
    queryKey: ["target_event", targetEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug, date, time, location, address, description")
        .eq("id", targetEventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!targetEventId && isEventInviteTemplate,
  });

  // Fetch target funnel details (para preencher variáveis)
  const { data: targetFunnel } = useQuery({
    queryKey: ["target_funnel", targetFunnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_funnels")
        .select("id, nome, slug, lead_magnet_nome, descricao")
        .eq("id", targetFunnelId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!targetFunnelId && isFunnelInviteTemplate,
  });

  // Fetch recipients based on type
  const { data: recipients, isLoading: loadingRecipients } = useQuery({
    queryKey: ["email_recipients", recipientType, selectedEvent, selectedFunnel],
    queryFn: async () => {
      if (recipientType === "all_contacts") {
        const { data, error } = await supabase
          .from("office_contacts")
          .select("id, nome, email")
          .not("email", "is", null)
          .neq("email", "");
        if (error) throw error;
        return data.map(c => ({ id: c.id, name: c.nome, email: c.email!, type: "contact" as const }));
      }

      if (recipientType === "event_contacts" && selectedEvent) {
        const { data, error } = await supabase
          .from("event_registrations")
          .select("id, nome, email, contact_id")
          .eq("event_id", selectedEvent);
        if (error) throw error;
        return data.map(r => ({ 
          id: r.contact_id || r.id, 
          name: r.nome, 
          email: r.email, 
          type: "contact" as const 
        }));
      }

      if (recipientType === "funnel_contacts" && selectedFunnel) {
        const { data, error } = await supabase
          .from("office_contacts")
          .select("id, nome, email")
          .eq("source_type", "captacao")
          .eq("source_id", selectedFunnel)
          .not("email", "is", null);
        if (error) throw error;
        return data.map(c => ({ id: c.id, name: c.nome, email: c.email!, type: "contact" as const }));
      }

      if (recipientType === "leaders") {
        const { data, error } = await supabase
          .from("lideres")
          .select("id, nome_completo, email")
          .eq("is_active", true)
          .not("email", "is", null)
          .neq("email", "");
        if (error) throw error;
        return data.map(l => ({ id: l.id, name: l.nome_completo, email: l.email!, type: "leader" as const }));
      }

      return [];
    },
    enabled: recipientType === "all_contacts" || 
             recipientType === "leaders" ||
             (recipientType === "event_contacts" && !!selectedEvent) ||
             (recipientType === "funnel_contacts" && !!selectedFunnel),
  });

  // Templates de convite permitidos por tipo de destinatário
  const CONVITE_TEMPLATES_LEADERS = [
    "lideranca-evento-convite",
    "captacao-convite-material",
    "evento-convite-participar",
  ];

  const CONVITE_TEMPLATES_CONTACTS = [
    "captacao-convite-material",
    "evento-convite-participar",
  ];

  // Filter templates based on recipient type
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    if (recipientType === "leaders") {
      return templates.filter(t => CONVITE_TEMPLATES_LEADERS.includes(t.slug));
    }
    
    return templates.filter(t => CONVITE_TEMPLATES_CONTACTS.includes(t.slug));
  }, [templates, recipientType]);

  const handleSend = () => {
    if (!selectedTemplate || !recipients?.length) return;

    const baseUrl = getBaseUrl();

    const recipientsList = recipients.map(r => {
      // Construir variáveis baseado no tipo de template
      const variables: Record<string, string> = {
        nome: r.name,
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
        variables.material_descricao = targetFunnel.descricao || "";
        variables.link_captacao = `${baseUrl}/captacao/${targetFunnel.slug}`;
      }

      return {
        to: r.email,
        toName: r.name,
        contactId: r.type === "contact" ? r.id : undefined,
        leaderId: r.type === "leader" ? r.id : undefined,
        eventId: isEventInviteTemplate ? targetEventId : (selectedEvent || undefined),
        variables,
      };
    });

    sendBulkEmail.mutate({
      templateSlug: selectedTemplate,
      recipients: recipientsList,
    });
  };

  const canSend = 
    selectedTemplate && 
    recipients && 
    recipients.length > 0 && 
    confirmed &&
    (!isEventInviteTemplate || targetEventId) &&
    (!isFunnelInviteTemplate || targetFunnelId);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuração do Envio</CardTitle>
            <CardDescription>
              Selecione o template e os destinatários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipient Type */}
            <div className="space-y-3">
              <Label>Tipo de Destinatários</Label>
              <RadioGroup
                value={recipientType}
                onValueChange={(v) => {
                  setRecipientType(v as RecipientType);
                  setSelectedEvent("");
                  setSelectedFunnel("");
                  setSelectedTemplate("");
                  setTargetEventId("");
                  setTargetFunnelId("");
                  setConfirmed(false);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_contacts" id="all_contacts" />
                  <Label htmlFor="all_contacts" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4" />
                    Todos os Contatos (com email)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="event_contacts" id="event_contacts" />
                  <Label htmlFor="event_contacts" className="flex items-center gap-2 cursor-pointer">
                    <Calendar className="h-4 w-4" />
                    Contatos de Evento Específico
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="funnel_contacts" id="funnel_contacts" />
                  <Label htmlFor="funnel_contacts" className="flex items-center gap-2 cursor-pointer">
                    <Target className="h-4 w-4" />
                    Contatos de Funil de Captação
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="leaders" id="leaders" />
                  <Label htmlFor="leaders" className="flex items-center gap-2 cursor-pointer">
                    <UserCheck className="h-4 w-4" />
                    Lideranças
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Event Selection (ORIGEM - de onde vêm os contatos) */}
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

            {/* Funnel Selection (ORIGEM - de onde vêm os contatos) */}
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

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Template de Email</Label>
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
                    <SelectItem key={template.slug} value={template.slug}>
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
          </CardContent>
        </Card>

        {/* Preview & Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Envio</CardTitle>
            <CardDescription>
              Revise antes de enviar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRecipients ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Destinatários</span>
                  <Badge variant="secondary" className="text-lg px-3">
                    {recipients?.length || 0}
                  </Badge>
                </div>

                {selectedTemplate && (
                  <div className="py-3 border-b">
                    <span className="text-muted-foreground">Template</span>
                    <p className="font-medium mt-1">
                      {filteredTemplates.find(t => t.slug === selectedTemplate)?.nome}
                    </p>
                  </div>
                )}

                {isEventInviteTemplate && targetEvent && (
                  <div className="py-3 border-b">
                    <span className="text-muted-foreground">Evento do Convite</span>
                    <p className="font-medium mt-1">{targetEvent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(targetEvent.date), "dd/MM/yyyy")} às {targetEvent.time}
                    </p>
                  </div>
                )}

                {isFunnelInviteTemplate && targetFunnel && (
                  <div className="py-3 border-b">
                    <span className="text-muted-foreground">Material do Convite</span>
                    <p className="font-medium mt-1">{targetFunnel.lead_magnet_nome}</p>
                  </div>
                )}

                {recipients && recipients.length > 0 && (
                  <div className="py-3">
                    <span className="text-muted-foreground text-sm">Primeiros destinatários:</span>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {recipients.slice(0, 5).map((r) => (
                        <div key={r.id} className="text-sm flex justify-between">
                          <span className="truncate">{r.name}</span>
                          <span className="text-muted-foreground truncate ml-2">{r.email}</span>
                        </div>
                      ))}
                      {recipients.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... e mais {recipients.length - 5} destinatários
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {recipients && recipients.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Você está prestes a enviar {recipients.length} emails. Esta ação não pode ser desfeita.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox
                    id="confirm"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                  />
                  <Label htmlFor="confirm" className="text-sm cursor-pointer">
                    Confirmo que desejo enviar estes emails
                  </Label>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canSend || sendBulkEmail.isPending}
                  onClick={handleSend}
                >
                  {sendBulkEmail.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar {recipients?.length || 0} Emails
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
