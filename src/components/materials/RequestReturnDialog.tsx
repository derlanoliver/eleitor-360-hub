import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import { useRequestReturn } from "@/hooks/materials/useMaterialReservations";

interface RequestReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    quantidade: number;
    returned_quantity: number;
    material?: { nome: string };
    leader?: { nome_completo: string };
  } | null;
}

export function RequestReturnDialog({ open, onOpenChange, reservation }: RequestReturnDialogProps) {
  const [quantity, setQuantity] = useState("");
  const requestReturn = useRequestReturn();

  if (!reservation) return null;

  const max = reservation.quantidade - reservation.returned_quantity;

  const handleSubmit = () => {
    const num = parseInt(quantity);
    if (isNaN(num) || num < 1 || num > max) return;
    requestReturn.mutate(
      { id: reservation.id, quantity: num },
      {
        onSuccess: () => {
          setQuantity("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setQuantity(""); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" /> Solicitar Devolução
          </DialogTitle>
          <DialogDescription>
            Informe a quantidade a ser devolvida para gerar o QR Code de confirmação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Material</Label>
            <p className="font-medium">{reservation.material?.nome || "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Coordenador / Líder</Label>
            <p className="font-medium">{reservation.leader?.nome_completo || "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Quantidade retirada</Label>
            <p className="font-medium">{reservation.quantidade}</p>
          </div>
          {reservation.returned_quantity > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Já devolvido</Label>
              <p className="font-medium">{reservation.returned_quantity}</p>
            </div>
          )}
          <div>
            <Label htmlFor="return-qty">Quantidade a devolver (máx {max})</Label>
            <Input
              id="return-qty"
              type="number"
              min={1}
              max={max}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`1 a ${max}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={requestReturn.isPending || !quantity || parseInt(quantity) < 1 || parseInt(quantity) > max}
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Solicitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
