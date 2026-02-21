import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateMaterial } from "@/hooks/materials/useCampaignMaterials";

const MATERIAL_TYPES = [
  "Santinho", "Santão", "Adesivo", "Bandeira", "Placa", "Kit", "Panfleto", "Camiseta", "Boné", "Outro",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMaterialDialog({ open, onOpenChange }: Props) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Santinho");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("unidade");
  const createMaterial = useCreateMaterial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMaterial.mutateAsync({
      nome,
      tipo,
      descricao: descricao || undefined,
      quantidade_produzida: parseInt(quantidade) || 0,
      unidade,
    });
    setNome(""); setTipo("Santinho"); setDescricao(""); setQuantidade(""); setUnidade("unidade");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do Material</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Santinho Campanha 2026" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATERIAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade Produzida</Label>
              <Input type="number" min="0" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="unidade" />
            </div>
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMaterial.isPending}>
              {createMaterial.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
