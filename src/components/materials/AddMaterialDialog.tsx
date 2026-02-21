import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateMaterial } from "@/hooks/materials/useCampaignMaterials";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus } from "lucide-react";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const createMaterial = useCreateMaterial();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let image_url: string | undefined;
    try {
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("material-images").upload(path, imageFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("material-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
      await createMaterial.mutateAsync({
        nome, tipo,
        descricao: descricao || undefined,
        quantidade_produzida: parseInt(quantidade) || 0,
        unidade, image_url,
      });
      setNome(""); setTipo("Santinho"); setDescricao(""); setQuantidade(""); setUnidade("unidade");
      setImageFile(null); setImagePreview(null);
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
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
            <Label>Foto do Material (opcional)</Label>
            <div className="flex items-center gap-3 mt-1">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
              ) : (
                <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <Input type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
            </div>
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMaterial.isPending || uploading}>
              {uploading ? "Enviando foto..." : createMaterial.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
