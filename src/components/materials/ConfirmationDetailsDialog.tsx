import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookmarkCheck, RotateCcw, MessageSquare, Clock, User, Phone, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MaterialReservation } from "@/hooks/materials/useMaterialReservations";

interface ConfirmationDetailsDialogProps {
  reservation: MaterialReservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  try { return format(new Date(d), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }); } catch { return "—"; }
}

function ChannelBadge({ via }: { via: string }) {
  if (via === "whatsapp") {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1"><MessageSquare className="h-3 w-3" /> WhatsApp</Badge>;
  }
  return <Badge variant="secondary" className="gap-1"><User className="h-3 w-3" /> Manual</Badge>;
}

export function ConfirmationDetailsDialog({ reservation, open, onOpenChange }: ConfirmationDetailsDialogProps) {
  if (!reservation) return null;

  const hasWithdrawalConfirmation = !!reservation.confirmed_via;
  const hasReturnConfirmation = !!reservation.return_confirmed_via;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Detalhes das Confirmações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Material info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Material:</span> <span className="font-medium">{reservation.material?.nome}</span></p>
            <p><span className="text-muted-foreground">Quantidade:</span> <span className="font-semibold">{reservation.quantidade.toLocaleString()} {reservation.material?.unidade}</span></p>
            <p><span className="text-muted-foreground">Coordenador:</span> <span className="font-medium">{reservation.leader?.nome_completo}</span></p>
            {reservation.leader?.telefone && (
              <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{reservation.leader.telefone}</span></p>
            )}
            <p><span className="text-muted-foreground">Código de retirada:</span> <Badge variant="outline" className="font-mono text-xs ml-1">{reservation.confirmation_code || "—"}</Badge></p>
            {reservation.return_confirmation_code && (
              <p><span className="text-muted-foreground">Código de devolução:</span> <Badge variant="outline" className="font-mono text-xs ml-1">{reservation.return_confirmation_code}</Badge></p>
            )}
          </div>

          <Separator />

          {/* Withdrawal confirmation */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-green-600" /> Confirmação de Retirada
            </h4>
            {hasWithdrawalConfirmation ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Canal:</span>
                  <ChannelBadge via={reservation.confirmed_via!} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Data/Hora:</span>
                  <span className="font-medium text-xs">{formatDate(reservation.confirmed_at)}</span>
                </div>
                {reservation.leader?.telefone && reservation.confirmed_via === "whatsapp" && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Número:</span>
                    <span className="font-mono text-xs">{reservation.leader.telefone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sem confirmação registrada</p>
            )}
          </div>

          {/* Return confirmation */}
          {(reservation.returned_quantity > 0 || hasReturnConfirmation) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-600" /> Confirmação de Devolução
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quantidade devolvida:</span>
                    <span className="font-semibold">{reservation.returned_quantity.toLocaleString()}</span>
                  </div>
                  {hasReturnConfirmation ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Canal:</span>
                        <ChannelBadge via={reservation.return_confirmed_via!} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Data/Hora:</span>
                        <span className="font-medium text-xs">{formatDate(reservation.return_confirmed_at)}</span>
                      </div>
                      {reservation.leader?.telefone && reservation.return_confirmed_via === "whatsapp" && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Número:</span>
                          <span className="font-mono text-xs">{reservation.leader.telefone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Devolução manual (sem confirmação via QR)</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
