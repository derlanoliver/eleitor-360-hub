import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Users, Calendar, Filter, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSMSTemplates, replaceTemplateVariables } from "@/hooks/useSMSTemplates";
import { useEvents } from "@/hooks/events/useEvents";
import { toast } from "sonner";
import { format } from "date-fns";

type RecipientType = "contacts" | "leaders" | "event";
type BatchSize = "10" | "20" | "30" | "50" | "100" | "all";

const BATCH_SIZES: { value: BatchSize; label: string }[] = [
  { value: "10", label: "10 por lote" },
  { value: "20", label: "20 por lote" },
  { value: "30", label: "30 por lote" },
  { value: "50", label: "50 por lote" },
  { value: "100", label: "100 por lote" },
  { value: "all", label: "Todos de uma vez" },
];

function getRandomDelay(): number {
  return Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000;
}

export function SMSBulkSendTab() {
  const { data: templates } = useSMSTemplates();
  const { data: events } = useEvents();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [recipientType, setRecipientType] = useState<RecipientType>("contacts");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [batchSize, setBatchSize] = useState<BatchSize>("20");
  
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);

  const activeTemplates = templates?.filter((t) => t.is_active) || [];
  const selectedTemplateData = templates?.find((t) => t.slug === selectedTemplate);

  // Fetch recipients based on type
  const { data: recipients, isLoading: loadingRecipients } = useQuery({
    queryKey: ["sms-recipients", recipientType, selectedEvent],
    queryFn: async () => {
      if (recipientType === "contacts") {
        const { data, error } = await supabase
          .from("office_contacts")
          .select("id, nome, telefone_norm, email")
          .eq("is_active", true)
          .not("telefone_norm", "is", null);
        if (error) throw error;
        return data.map((c) => ({
          id: c.id,
          nome: c.nome,
          phone: c.telefone_norm,
          email: c.email,
        }));
      } else if (recipientType === "leaders") {
        const { data, error } = await supabase
          .from("lideres")
          .select("id, nome_completo, telefone, email")
          .eq("is_active", true)
          .not("telefone", "is", null);
        if (error) throw error;
        return data.map((l) => ({
          id: l.id,
          nome: l.nome_completo,
          phone: l.telefone,
          email: l.email,
        }));
      } else if (recipientType === "event" && selectedEvent) {
        const { data, error } = await supabase
          .from("event_registrations")
          .select("id, nome, whatsapp, email")
          .eq("event_id", selectedEvent);
        if (error) throw error;
        return data.map((r) => ({
          id: r.id,
          nome: r.nome,
          phone: r.whatsapp,
          email: r.email,
        }));
      }
      return [];
    },
    enabled: recipientType !== "event" || !!selectedEvent,
  });

  const handleSendBulk = async () => {
    if (!selectedTemplate || !recipients || recipients.length === 0) {
      toast.error("Selecione um template e verifique os destinatários");
      return;
    }

    setIsSending(true);
    setWaitingForConfirmation(false);
    setSentCount(0);
    
    const batchSizeNum = batchSize === "all" ? recipients.length : parseInt(batchSize);
    const batches = Math.ceil(recipients.length / batchSizeNum);
    
    setTotalBatches(batches);
    setTotalCount(recipients.length);

    for (let batchIndex = currentBatch; batchIndex < batches; batchIndex++) {
      setCurrentBatch(batchIndex + 1);
      
      const start = batchIndex * batchSizeNum;
      const end = Math.min(start + batchSizeNum, recipients.length);
      const batchRecipients = recipients.slice(start, end);

      for (let i = 0; i < batchRecipients.length; i++) {
        const recipient = batchRecipients[i];
        
        try {
          const variables: Record<string, string> = {
            nome: recipient.nome || "",
            email: recipient.email || "",
          };

          // Add event variables if applicable
          if (recipientType === "event" && selectedEvent) {
            const event = events?.find((e) => e.id === selectedEvent);
            if (event) {
              variables.evento_nome = event.name;
              variables.evento_data = format(new Date(event.date), "dd/MM/yyyy");
              variables.evento_hora = event.time;
              variables.evento_local = event.location;
            }
          }

          const { error } = await supabase.functions.invoke("send-sms", {
            body: {
              phone: recipient.phone,
              templateSlug: selectedTemplate,
              variables,
            },
          });

          if (error) throw error;
          setSentCount((prev) => prev + 1);
        } catch (error) {
          console.error("Error sending SMS:", error);
        }

        // Update progress
        const totalSent = start + i + 1;
        setSendProgress((totalSent / recipients.length) * 100);

        // Add delay between messages
        if (i < batchRecipients.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));
        }
      }

      // After batch, wait for confirmation if not last batch
      if (batchIndex < batches - 1) {
        toast.success(`Lote ${batchIndex + 1} concluído!`);
        setWaitingForConfirmation(true);
        setIsSending(false);
        return;
      }
    }

    // All done
    toast.success(`Envio concluído! ${sentCount} mensagens enviadas.`);
    resetState();
  };

  const resetState = () => {
    setIsSending(false);
    setSendProgress(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setSentCount(0);
    setTotalCount(0);
    setWaitingForConfirmation(false);
  };

  const handleContinue = () => {
    handleSendBulk();
  };

  const handleCancel = () => {
    resetState();
  };

  const estimatedTime = recipients
    ? Math.ceil((recipients.length * 4.5) / 60)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Configuração do Envio
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para o envio em massa de SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template SMS</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((template) => (
                    <SelectItem key={template.slug} value={template.slug}>
                      {template.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destinatários</Label>
              <Select
                value={recipientType}
                onValueChange={(v) => {
                  setRecipientType(v as RecipientType);
                  setSelectedEvent("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Todos os Contatos
                    </div>
                  </SelectItem>
                  <SelectItem value="leaders">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Todas as Lideranças
                    </div>
                  </SelectItem>
                  <SelectItem value="event">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Inscritos em Evento
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === "event" && (
              <div className="space-y-2">
                <Label>Evento</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
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

            <div className="space-y-2">
              <Label>Tamanho do Lote</Label>
              <Select value={batchSize} onValueChange={(v) => setBatchSize(v as BatchSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Resumo do Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {loadingRecipients ? "..." : recipients?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Destinatários</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">~{estimatedTime} min</div>
                <div className="text-sm text-muted-foreground">Tempo estimado</div>
              </div>
            </div>

            {selectedTemplateData && (
              <div className="space-y-2">
                <Label>Preview da Mensagem</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p>{selectedTemplateData.mensagem}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {selectedTemplateData.mensagem.length}/160 caracteres
                  </div>
                </div>
                {selectedTemplateData.variaveis?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTemplateData.variaveis.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(isSending || waitingForConfirmation) && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>
                    Lote {currentBatch} de {totalBatches}
                  </span>
                  <span>
                    {sentCount}/{totalCount} enviados
                  </span>
                </div>
                <Progress value={sendProgress} />
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O envio utiliza intervalos de 3-6 segundos entre mensagens para evitar bloqueios.
              </AlertDescription>
            </Alert>

            {waitingForConfirmation ? (
              <div className="flex gap-2">
                <Button onClick={handleContinue} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Continuar Envio
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleSendBulk()}
                disabled={
                  isSending ||
                  !selectedTemplate ||
                  !recipients?.length ||
                  (recipientType === "event" && !selectedEvent)
                }
              >
                {isSending ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Iniciar Envio em Massa
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
