import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PlayCircle, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BulkSendSession } from "@/hooks/useBulkSendSession";

interface ResumeSessionAlertProps {
  session: BulkSendSession;
  onResume: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
}

export function ResumeSessionAlert({
  session,
  onResume,
  onDiscard,
  onDismiss,
}: ResumeSessionAlertProps) {
  const sentCount = session.sentIdentifiers.length;
  const pendingCount = session.totalRecipients - sentCount;
  const startedAt = format(new Date(session.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Envio incompleto detectado
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Template: <span className="font-medium">{session.templateName}</span>
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Progresso: <span className="font-medium">{sentCount}/{session.totalRecipients}</span> ({pendingCount} pendentes)
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Iniciado em {startedAt}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:text-amber-800"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onResume}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Retomar envio ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDiscard}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Descartar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
