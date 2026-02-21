import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePoEvents } from "@/hooks/public-opinion/usePublicOpinion";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface SelectEventReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId?: string;
  loading: boolean;
  onSelect: (eventId: string) => void;
}

export function SelectEventReportDialog({ open, onOpenChange, entityId, loading, onSelect }: SelectEventReportDialogProps) {
  const { data: events, isLoading } = usePoEvents(entityId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Evento</DialogTitle>
          <DialogDescription>Escolha um evento para gerar o relatório de análise de impacto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !events?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento registrado.</p>
          ) : (
            events.map((event) => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3"
                disabled={loading}
                onClick={() => onSelect(event.id)}
              >
                <div>
                  <p className="font-medium text-sm">{event.titulo}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(event.data_evento + "T12:00:00"), "dd/MM/yyyy")} • {event.tipo}</p>
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
