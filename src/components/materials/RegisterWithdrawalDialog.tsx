import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReservation } from "@/hooks/materials/useMaterialReservations";
import { useCampaignMaterials } from "@/hooks/materials/useCampaignMaterials";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import { WithdrawalQRCode } from "./WithdrawalQRCode";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedMaterialId?: string;
}

export function RegisterWithdrawalDialog({ open, onOpenChange, preselectedMaterialId }: Props) {
  const [materialId, setMaterialId] = useState(preselectedMaterialId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<any>(null);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [createdReservation, setCreatedReservation] = useState<{ confirmation_code: string; materialName: string } | null>(null);
  const createReservation = useCreateReservation();
  const { data: materials } = useCampaignMaterials();

  // Search leaders by name, phone, or email
  const { data: leaders } = useQuery({
    queryKey: ["leaders_search", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      const term = `%${searchTerm}%`;
      const { data, error } = await supabase
        .from("lideres")
        .select("id, nome_completo, telefone, email, status, is_coordinator, cidade_id")
        .or(`nome_completo.ilike.${term},telefone.ilike.${term},email.ilike.${term}`)
        .eq("is_active", true)
        .limit(10);
      if (error) throw error;

      const cityIds = [...new Set((data || []).map(l => l.cidade_id).filter(Boolean))];
      let cityMap: Record<string, string> = {};
      if (cityIds.length > 0) {
        const { data: cities } = await supabase.from("office_cities").select("id, nome").in("id", cityIds);
        cityMap = (cities || []).reduce((acc: Record<string, string>, c: any) => { acc[c.id] = c.nome; return acc; }, {});
      }

      return (data || []).map(l => ({ ...l, cidade_nome: l.cidade_id ? cityMap[l.cidade_id] || "—" : "—" }));
    },
    enabled: searchTerm.length >= 2,
  });

  const selectedMaterial = useMemo(() => materials?.find(m => m.id === materialId), [materials, materialId]);

  const resetForm = () => {
    setSelectedLeader(null);
    setSearchTerm("");
    setQuantidade("");
    setObservacao("");
    if (!preselectedMaterialId) setMaterialId("");
    setCreatedReservation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader || !materialId) return;
    const result = await createReservation.mutateAsync({
      material_id: materialId,
      leader_id: selectedLeader.id,
      quantidade: parseInt(quantidade) || 0,
      observacao: observacao || undefined,
      origin: "direct",
    });
    // Show QR code for WhatsApp confirmation
    setCreatedReservation({
      confirmation_code: result.confirmation_code || "",
      materialName: selectedMaterial?.nome || "Material",
    });
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  // After reservation is created, show QR code
  if (createdReservation && open) {
    return (
      <WithdrawalQRCode
        confirmationCode={createdReservation.confirmation_code}
        materialName={createdReservation.materialName}
        open={open}
        onOpenChange={handleClose}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Retirada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Material */}
          <div>
            <Label>Material</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger><SelectValue placeholder="Selecione o material" /></SelectTrigger>
              <SelectContent>
                {(materials || []).filter(m => m.is_active).map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} (estoque: {m.estoque_atual})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Leader */}
          <div>
            <Label>Quem está retirando</Label>
            {selectedLeader ? (
              <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedLeader.nome_completo}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedLeader(null)}>Trocar</Button>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{selectedLeader.is_coordinator ? "Coordenador" : "Líder"}</Badge>
                  <span>{selectedLeader.cidade_nome}</span>
                  {selectedLeader.telefone && <span>{selectedLeader.telefone}</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, telefone ou e-mail..."
                    className="pl-9"
                  />
                </div>
                {leaders && leaders.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                    {leaders.map(l => (
                      <button
                        key={l.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors text-sm"
                        onClick={() => { setSelectedLeader(l); setSearchTerm(""); }}
                      >
                        <span className="font-medium">{l.nome_completo}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {l.is_coordinator ? "Coordenador" : "Líder"} • {l.cidade_nome}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {searchTerm.length >= 2 && leaders?.length === 0 && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5 py-2">
                    <AlertCircle className="h-4 w-4" />
                    Nenhuma liderança encontrada. Cadastre primeiro na aba Lideranças.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              max={selectedMaterial?.estoque_atual || 999999}
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              required
            />
            {selectedMaterial && (
              <p className="text-xs text-muted-foreground mt-1">
                Disponível em estoque: {selectedMaterial.estoque_atual} {selectedMaterial.unidade}(s)
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Observação (opcional)</Label>
            <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2} />
          </div>

          <p className="text-xs text-muted-foreground">
            Após registrar, será gerado um QR Code para o coordenador/líder confirmar a retirada via WhatsApp.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button type="submit" disabled={createReservation.isPending || !selectedLeader || !materialId}>
              {createReservation.isPending ? "Registrando..." : "Registrar Retirada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
