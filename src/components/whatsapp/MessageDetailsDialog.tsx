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
import { MessageStatusBadge, DirectionBadge } from "./MessageStatusBadge";
import { WhatsAppMessage } from "@/hooks/useWhatsAppMessages";
import { Phone, User, Clock, MessageSquare, Building2, AlertCircle } from "lucide-react";
import { useDemoMask } from "@/contexts/DemoModeContext";

interface MessageDetailsDialogProps {
  message: WhatsAppMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageDetailsDialog({
  message,
  open,
  onOpenChange,
}: MessageDetailsDialogProps) {
  const { m } = useDemoMask();

  if (!message) return null;

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DirectionBadge direction={message.direction} />
            Detalhes da Mensagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <MessageStatusBadge status={message.status} direction={message.direction} />
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Telefone:</span>
              <span className="font-medium">{m.phone(message.phone)}</span>
            </div>

            {message.contact && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Contato:</span>
                <span className="font-medium">{m.name(message.contact.nome)}</span>
              </div>
            )}

            {message.visit && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Visita:</span>
                <Badge variant="outline">{message.visit.protocolo}</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Message Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>Conteúdo</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
              {message.message}
            </div>
          </div>

          {/* Error Message */}
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
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground block">Criada</span>
                <span className="font-medium">{formatDateTime(message.created_at)}</span>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground block">Enviada</span>
                <span className="font-medium">{formatDateTime(message.sent_at)}</span>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground block">Entregue</span>
                <span className="font-medium">{formatDateTime(message.delivered_at)}</span>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <span className="text-muted-foreground block">Lida</span>
                <span className="font-medium">{formatDateTime(message.read_at)}</span>
              </div>
            </div>
          </div>

          {/* Message ID */}
          {message.message_id && (
            <div className="text-xs text-muted-foreground">
              ID: {message.message_id}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
