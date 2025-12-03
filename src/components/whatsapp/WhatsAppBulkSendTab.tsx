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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useWhatsAppTemplates,
  replaceTemplateVariables,
} from "@/hooks/useWhatsAppTemplates";

type RecipientType = "leaders" | "event_contacts" | "funnel_contacts" | "all_contacts";

// Templates de convite permitidos por tipo de destinatário
const CONVITE_TEMPLATES_LEADERS = [
  "evento-convite",           // Convite para Evento
  "captacao-convite",         // Convite para Material de Captação
];

const CONVITE_TEMPLATES_CONTACTS = [
  "evento-convite",           // Convite para Evento
  "captacao-convite",         // Convite para Material de Captação
];

export function WhatsAppBulkSendTab() {
  const [recipientType, setRecipientType] = useState<RecipientType>("all_contacts");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedFunnel, setSelectedFunnel] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  const { data: templates } = useWhatsAppTemplates();

  // Fetch events
  const { data: events } = useQuery({
    queryKey: ["events-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug")
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
        .select("id, nome, slug")
        .eq("status", "active")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
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

    // Todos os outros tipos: 2 templates de convite
    return activeTemplates.filter((t) => CONVITE_TEMPLATES_CONTACTS.includes(t.slug));
  }, [templates, recipientType]);

  const selectedTemplateData = templates?.find((t) => t.id === selectedTemplate);

  const canSend =
    selectedTemplate &&
    recipientsData &&
    recipientsData.count > 0 &&
    (recipientType === "leaders" ||
      recipientType === "all_contacts" ||
      (recipientType === "event_contacts" && selectedEvent) ||
      (recipientType === "funnel_contacts" && selectedFunnel));

  const handleSend = async () => {
    if (!canSend || !selectedTemplateData) return;

    setIsSending(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const recipients = recipientsData.recipients as Record<string, unknown>[];

      for (const recipient of recipients) {
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

        // Build variables based on recipient data
        const variables: Record<string, string> = {
          nome,
        };

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

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
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
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Certifique-se de que a integração Z-API está configurada e ativa antes de
          realizar envios em massa.
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
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
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

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSend}
          disabled={!canSend || isSending}
          className="min-w-[200px]"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar para {recipientsData?.count || 0} destinatários
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
