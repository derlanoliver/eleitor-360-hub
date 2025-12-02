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

type RecipientType = "all_contacts" | "event_contacts" | "funnel_contacts" | "leaders";

export function EmailBulkSendTab() {
  const { data: templates, isLoading: loadingTemplates } = useEmailTemplates();
  const { data: events } = useEvents();
  const sendBulkEmail = useSendBulkEmail();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipientType, setRecipientType] = useState<RecipientType>("all_contacts");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedFunnel, setSelectedFunnel] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Fetch funnels
  const { data: funnels } = useQuery({
    queryKey: ["lead_funnels_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_funnels")
        .select("id, nome")
        .eq("status", "active")
        .order("nome");
      if (error) throw error;
      return data;
    },
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

  // Filter templates based on recipient type
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    if (recipientType === "leaders") {
      return templates.filter(t => t.categoria === "lideranca");
    }
    if (recipientType === "event_contacts") {
      return templates.filter(t => t.categoria === "evento");
    }
    if (recipientType === "funnel_contacts") {
      return templates.filter(t => t.categoria === "captacao");
    }
    return templates.filter(t => !["lideranca"].includes(t.categoria));
  }, [templates, recipientType]);

  const handleSend = () => {
    if (!selectedTemplate || !recipients?.length) return;

    const recipientsList = recipients.map(r => ({
      to: r.email,
      toName: r.name,
      contactId: r.type === "contact" ? r.id : undefined,
      leaderId: r.type === "leader" ? r.id : undefined,
      eventId: selectedEvent || undefined,
      variables: {
        nome: r.name,
      },
    }));

    sendBulkEmail.mutate({
      templateSlug: selectedTemplate,
      recipients: recipientsList,
    });
  };

  const canSend = selectedTemplate && recipients && recipients.length > 0 && confirmed;

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

            {/* Event Selection */}
            {recipientType === "event_contacts" && (
              <div className="space-y-2">
                <Label>Selecione o Evento</Label>
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

            {/* Funnel Selection */}
            {recipientType === "funnel_contacts" && (
              <div className="space-y-2">
                <Label>Selecione o Funil</Label>
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
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
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
