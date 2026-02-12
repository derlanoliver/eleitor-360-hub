import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Clock, MessageSquare, Mail, MessageCircle, AlertCircle } from "lucide-react";

interface CoordinatorMessage {
  channel: string;
  subject: string;
  status: string;
  sent_at: string | null;
  message?: string;
  phone?: string;
  to_email?: string;
  error_message?: string;
  delivered_at?: string;
  read_at?: string;
  created_at?: string;
}

interface Props {
  message: CoordinatorMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoordinatorMessageDetailsDialog({ message, open, onOpenChange }: Props) {
  if (!message) return null;

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      sent: "Enviado", delivered: "Entregue", read: "Lido", failed: "Falhou",
      pending: "Pendente", queued: "Na fila", error: "Erro", sending: "Enviando",
      opened: "Aberto", clicked: "Clicado", bounced: "Rejeitado",
    };
    return map[status?.toLowerCase()] || status;
  };

  const channelIcon = {
    whatsapp: <MessageCircle className="h-4 w-4 text-green-600" />,
    email: <Mail className="h-4 w-4 text-blue-600" />,
    sms: <Phone className="h-4 w-4 text-orange-600" />,
  }[message.channel] || <MessageSquare className="h-4 w-4" />;

  const channelLabel = {
    whatsapp: "WhatsApp",
    email: "E-mail",
    sms: "SMS",
  }[message.channel] || message.channel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channelIcon}
            Detalhes da Mensagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Canal:</span>
              <Badge variant="outline">{channelLabel}</Badge>
            </div>
            <Badge variant="secondary">{translateStatus(message.status)}</Badge>
          </div>

          <Separator />

          {/* Destination */}
          <div className="space-y-2">
            {message.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{message.phone}</span>
              </div>
            )}
            {message.to_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-medium">{message.to_email}</span>
              </div>
            )}
          </div>

          {/* Subject */}
          {message.subject && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Assunto</span>
                <p className="text-sm font-medium">{message.subject}</p>
              </div>
            </>
          )}

          {/* Message Content */}
          {message.message && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>Conteúdo</span>
                </div>
                {message.channel === 'email' && message.message.includes('<') ? (
                  <div
                    className="bg-muted/50 rounded-lg p-3 text-sm max-h-64 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: message.message }}
                  />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {message.message}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error */}
          {message.error_message && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro</span>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                  {message.error_message}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timestamps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Histórico</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {message.created_at && (
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-muted-foreground block">Criada</span>
                  <span className="font-medium">{formatDateTime(message.created_at)}</span>
                </div>
              )}
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground block">Enviada</span>
                <span className="font-medium">{formatDateTime(message.sent_at)}</span>
              </div>
              {message.delivered_at && (
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-muted-foreground block">Entregue</span>
                  <span className="font-medium">{formatDateTime(message.delivered_at)}</span>
                </div>
              )}
              {message.read_at && (
                <div className="bg-muted/30 rounded p-2">
                  <span className="text-muted-foreground block">Lida</span>
                  <span className="font-medium">{formatDateTime(message.read_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
