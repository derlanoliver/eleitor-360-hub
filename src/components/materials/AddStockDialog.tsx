import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddStock, type CampaignMaterial } from "@/hooks/materials/useCampaignMaterials";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: CampaignMaterial | null;
}

export function AddStockDialog({ open, onOpenChange, material }: Props) {
  const [quantidade, setQuantidade] = useState("");
  const addStock = useAddStock();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;
    await addStock.mutateAsync({ id: material.id, quantidade: parseInt(quantidade) || 0 });
    setQuantidade("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar Estoque</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Material: <strong>{material?.nome}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quantidade a adicionar</Label>
            <Input type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={addStock.isPending}>
              {addStock.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
