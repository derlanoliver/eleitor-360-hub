import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useCampaignMaterials } from "@/hooks/materials/useCampaignMaterials";
import { useMaterialReservations, useCreateReservation, useCancelReservation } from "@/hooks/materials/useMaterialReservations";
import { differenceInSeconds } from "date-fns";

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const exp = new Date(expiresAt);
      const diff = differenceInSeconds(exp, now);
      if (diff <= 0) {
        setTimeLeft("Expirado");
        return;
      }
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setTimeLeft(`${days}d ${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpiringSoon = differenceInSeconds(new Date(expiresAt), new Date()) < 86400;

  return (
    <span className={`text-xs font-mono ${isExpiringSoon ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
      {timeLeft}
    </span>
  );
}

interface Props {
  leaderId: string;
}

export function CoordinatorMaterialRequestCard({ leaderId }: Props) {
  const { data: materials, isLoading: loadingMaterials } = useCampaignMaterials();
  const { data: reservations, isLoading: loadingReservations } = useMaterialReservations({ leader_id: leaderId });
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();

  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const activeMaterials = (materials || []).filter(m => m.is_active && m.estoque_atual > 0);
  const selectedMaterial = activeMaterials.find(m => m.id === selectedMaterialId);
  const activeReservations = (reservations || []).filter(r => r.status === "reserved");

  const handleSubmit = () => {
    if (!selectedMaterialId || !quantidade) return;
    const qty = parseInt(quantidade);
    if (isNaN(qty) || qty <= 0) return;
    if (selectedMaterial && qty > selectedMaterial.estoque_atual) return;

    createReservation.mutate({
      material_id: selectedMaterialId,
      leader_id: leaderId,
      quantidade: qty,
    }, {
      onSuccess: () => {
        setSelectedMaterialId("");
        setQuantidade("");
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" /> Solicitar Material
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Request Form */}
        <div className="space-y-3 border rounded-lg p-3">
          <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o material" />
            </SelectTrigger>
            <SelectContent>
              {loadingMaterials ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : activeMaterials.length === 0 ? (
                <SelectItem value="none" disabled>Nenhum material disponível</SelectItem>
              ) : (
                activeMaterials.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} ({m.tipo})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedMaterial && (
            <div className="bg-muted/50 rounded-md p-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estoque disponível:</span>
                <span className="font-semibold">{selectedMaterial.estoque_atual.toLocaleString()} {selectedMaterial.unidade}</span>
              </div>
            </div>
          )}

          <Input
            type="number"
            placeholder="Quantidade desejada"
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
            min={1}
            max={selectedMaterial?.estoque_atual || undefined}
          />

          {selectedMaterial && parseInt(quantidade) > selectedMaterial.estoque_atual && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Quantidade acima do estoque disponível
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={
              !selectedMaterialId ||
              !quantidade ||
              parseInt(quantidade) <= 0 ||
              (selectedMaterial ? parseInt(quantidade) > selectedMaterial.estoque_atual : false) ||
              createReservation.isPending
            }
          >
            {createReservation.isPending ? "Reservando..." : "Reservar Material"}
          </Button>
        </div>

        {/* Active Reservations */}
        {loadingReservations ? (
          <p className="text-sm text-muted-foreground">Carregando reservas...</p>
        ) : activeReservations.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <Clock className="h-4 w-4" /> Reservas Ativas ({activeReservations.length})
            </h4>
            {activeReservations.map(r => (
              <div key={r.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.material?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.quantidade.toLocaleString()} {r.material?.unidade}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
                    <Clock className="h-3 w-3" /> Reservado
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-muted-foreground">Retirar em:</span>
                    <CountdownTimer expiresAt={r.expires_at} />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 text-destructive hover:text-destructive"
                    onClick={() => cancelReservation.mutate(r.id)}
                    disabled={cancelReservation.isPending}
                  >
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma reserva ativa.</p>
        )}

        {/* Past reservations summary */}
        {(reservations || []).filter(r => r.status !== "reserved").length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Histórico</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {(reservations || []).filter(r => r.status !== "reserved").slice(0, 10).map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs border rounded px-2 py-1.5">
                  <span>{r.material?.nome} · {r.quantidade} {r.material?.unidade}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      r.status === "withdrawn" ? "text-green-600 border-green-300" :
                      r.status === "expired" ? "text-red-600 border-red-300" :
                      "text-muted-foreground"
                    }`}
                  >
                    {r.status === "withdrawn" ? "Retirado" : r.status === "expired" ? "Expirado" : "Cancelado"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
