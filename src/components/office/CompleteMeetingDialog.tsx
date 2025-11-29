import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText } from "lucide-react";

interface CompleteMeetingDialogProps {
  visit: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (visitId: string) => void;
  onRegisterMinutes: (visit: any) => void;
}

export function CompleteMeetingDialog({
  visit,
  open,
  onOpenChange,
  onComplete,
  onRegisterMinutes,
}: CompleteMeetingDialogProps) {
  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Reunião</DialogTitle>
          <DialogDescription>
            Como deseja finalizar esta reunião?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Button
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              variant="outline"
              onClick={() => onComplete(visit.id)}
            >
              <CheckCircle2 className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Finalizar sem Ata</div>
                <div className="text-xs text-muted-foreground">
                  Marcar reunião como realizada sem documentação
                </div>
              </div>
            </Button>

            <Button
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => onRegisterMinutes(visit)}
            >
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Cadastrar Ata</div>
                <div className="text-xs opacity-90">
                  Registrar documentação da reunião
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
