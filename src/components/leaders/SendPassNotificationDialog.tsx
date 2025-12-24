import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2, Send, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { OfficeLeader } from "@/types/office";

interface SendPassNotificationDialogProps {
  children?: React.ReactNode;
  leader?: OfficeLeader; // Para envio individual
  leaders?: OfficeLeader[]; // Para envio em massa
  allVerifiedCount?: number; // Contagem para envio a todos
  onSendToAll?: () => Promise<string[]>; // Retorna IDs de todos os líderes verificados
}

export function SendPassNotificationDialog({
  children,
  leader,
  leaders,
  allVerifiedCount,
  onSendToAll,
}: SendPassNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendToAllSelected, setSendToAllSelected] = useState(false);

  const maxLength = 150;
  const charactersLeft = maxLength - message.length;

  // Determinar modo e contagem
  const isIndividual = !!leader && !leaders?.length;
  const isMultiple = !!leaders?.length;
  const showAllOption = !!allVerifiedCount && allVerifiedCount > 0;

  const getRecipientCount = () => {
    if (sendToAllSelected && allVerifiedCount) return allVerifiedCount;
    if (isMultiple) return leaders?.length || 0;
    if (isIndividual) return 1;
    return 0;
  };

  const getRecipientLabel = () => {
    if (sendToAllSelected) return `Todos os ${allVerifiedCount} líderes verificados`;
    if (isMultiple) return `${leaders?.length} líderes selecionados`;
    if (isIndividual) return leader?.nome_completo || "1 líder";
    return "Nenhum destinatário";
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setSending(true);
    try {
      let leaderIds: string[] = [];

      if (sendToAllSelected && onSendToAll) {
        leaderIds = await onSendToAll();
      } else if (isMultiple && leaders) {
        leaderIds = leaders.map((l) => l.id);
      } else if (isIndividual && leader) {
        leaderIds = [leader.id];
      }

      if (leaderIds.length === 0) {
        toast.error("Nenhum destinatário selecionado");
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-pass-notification", {
        body: {
          leaderIds,
          message: message.trim(),
        },
      });

      if (error) {
        throw error;
      }

      if (data?.summary) {
        const { success, failed } = data.summary;

        if (failed === 0) {
          toast.success(`Notificação enviada para ${success} líder(es)!`);
        } else if (success === 0) {
          const firstError = data?.results?.find((r: any) => !r?.success)?.error;
          toast.error(
            firstError
              ? `Falha ao enviar (${failed}). Motivo: ${firstError}`
              : `Falha ao enviar para todos os ${failed} líder(es).`
          );
        } else {
          toast.warning(`Enviado para ${success} líder(es). ${failed} falha(s).`);
        }
      } else {
        toast.success("Notificação enviada com sucesso!");
      }

      setMessage("");
      setSendToAllSelected(false);
      setOpen(false);
    } catch (error: unknown) {
      console.error("Erro ao enviar notificação:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar notificação");
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setMessage("");
      setSendToAllSelected(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificação Push
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Enviar Notificação Push
          </DialogTitle>
          <DialogDescription>
            Envie uma notificação para os cartões digitais instalados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Destinatários */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Destinatários</Label>
            <div className="flex flex-wrap gap-2">
              {isIndividual && (
                <Badge variant="secondary" className="gap-1">
                  <Bell className="h-3 w-3" />
                  {leader?.nome_completo}
                </Badge>
              )}
              {isMultiple && !sendToAllSelected && (
                <Badge variant="secondary" className="gap-1">
                  <Bell className="h-3 w-3" />
                  {leaders?.length} selecionados
                </Badge>
              )}
              {showAllOption && (
                <Button
                  type="button"
                  variant={sendToAllSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSendToAllSelected(!sendToAllSelected)}
                  className="h-7 text-xs"
                >
                  Todos verificados ({allVerifiedCount})
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              → {getRecipientLabel()}
            </p>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Mensagem
            </Label>
            <Textarea
              id="message"
              placeholder="Digite a mensagem da notificação..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
              className="resize-none h-24"
              disabled={sending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={charactersLeft < 20 ? "text-amber-500" : ""}>
                {charactersLeft} caracteres restantes
              </span>
              <span>{message.length}/{maxLength}</span>
            </div>
          </div>

          {/* Aviso importante sobre o template */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-medium">Requisitos para push notification:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Líder precisa ter o cartão instalado no Apple Wallet</li>
                <li>O campo <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">meta.notification</code> deve ter <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">changeMessage</code> com <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">%@</code> no template</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim() || getRecipientCount() === 0}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar ({getRecipientCount()})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
