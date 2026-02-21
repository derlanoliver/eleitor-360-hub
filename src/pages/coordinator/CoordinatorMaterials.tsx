import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCoordinatorAuth } from "@/contexts/CoordinatorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, AlertTriangle, ArrowLeft, BookmarkCheck, X } from "lucide-react";
import { useCampaignMaterials } from "@/hooks/materials/useCampaignMaterials";
import { useMaterialReservations, useCreateReservation, useCancelReservation } from "@/hooks/materials/useMaterialReservations";
import { differenceInSeconds, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo-rafael-prudente.png";

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = differenceInSeconds(new Date(expiresAt), new Date());
      if (diff <= 0) { setTimeLeft("Expirado"); return; }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${d}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  const isExpiring = differenceInSeconds(new Date(expiresAt), new Date()) < 86400;
  return <span className={`font-mono text-xs ${isExpiring ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{timeLeft}</span>;
}

export default function CoordinatorMaterials() {
  const { session, isAuthenticated } = useCoordinatorAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/coordenador/login", { replace: true });
  }, [isAuthenticated, navigate]);

  const { data: materials, isLoading: loadingMaterials } = useCampaignMaterials();
  const { data: reservations, isLoading: loadingReservations } = useMaterialReservations({ leader_id: session?.leader_id });
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();

  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState("");

  if (!isAuthenticated || !session) return null;

  const activeMaterials = (materials || []).filter(m => m.is_active && m.estoque_atual > 0);
  const selectedMaterial = activeMaterials.find(m => m.id === selectedMaterialId);
  const activeReservations = (reservations || []).filter(r => r.status === "reserved");
  const pastReservations = (reservations || []).filter(r => r.status !== "reserved");

  const handleSubmit = () => {
    if (!selectedMaterialId || !quantidade) return;
    const qty = parseInt(quantidade);
    if (isNaN(qty) || qty <= 0) return;
    if (selectedMaterial && qty > selectedMaterial.estoque_atual) return;
    createReservation.mutate({ material_id: selectedMaterialId, leader_id: session.leader_id, quantidade: qty }, {
      onSuccess: () => { setSelectedMaterialId(""); setQuantidade(""); },
    });
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }); } catch { return "—"; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8" />
            <div>
              <p className="font-semibold text-sm">{session.nome_completo}</p>
              <p className="text-xs text-muted-foreground">Solicitar Material</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/coordenador/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" /> Solicitar Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <div className="flex items-center gap-2">
                        {m.image_url && <img src={m.image_url} alt={m.nome} className="h-6 w-6 rounded object-cover" />}
                        <span>{m.nome} ({m.tipo})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedMaterial && (
              <div className="bg-muted/50 rounded-md p-3">
                <div className="flex items-center gap-3">
                  {selectedMaterial.image_url && (
                    <img src={selectedMaterial.image_url} alt={selectedMaterial.nome} className="h-16 w-16 rounded-lg object-cover border" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedMaterial.nome}</p>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Estoque disponível:</span>
                      <span className="font-semibold">{selectedMaterial.estoque_atual.toLocaleString()} {selectedMaterial.unidade}</span>
                    </div>
                  </div>
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
                !selectedMaterialId || !quantidade || parseInt(quantidade) <= 0 ||
                (selectedMaterial ? parseInt(quantidade) > selectedMaterial.estoque_atual : false) ||
                createReservation.isPending
              }
            >
              {createReservation.isPending ? "Reservando..." : "Reservar Material"}
            </Button>
          </CardContent>
        </Card>

        {/* Active Reservations */}
        {activeReservations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" /> Reservas Ativas ({activeReservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeReservations.map(r => (
                <div key={r.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(r.material as any)?.image_url && (
                        <img src={(r.material as any).image_url} alt={r.material?.nome} className="h-12 w-12 rounded-lg object-cover border" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{r.material?.nome}</p>
                        <p className="text-xs text-muted-foreground">{r.quantidade.toLocaleString()} {r.material?.unidade}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
                      <Clock className="h-3 w-3" /> Reservado
                    </Badge>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Prazo:</span>
                        <span className="font-medium">{formatDate(r.expires_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span className="text-muted-foreground">Tempo restante:</span>
                        <CountdownTimer expiresAt={r.expires_at} />
                      </div>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="text-xs h-8 text-destructive border-destructive/20 hover:bg-destructive/5"
                      onClick={() => cancelReservation.mutate(r.id)}
                      disabled={cancelReservation.isPending}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" /> Histórico de Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReservations ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : pastReservations.length === 0 && activeReservations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma solicitação registrada.</p>
            ) : (
              <div className="space-y-2">
                {(reservations || []).map(r => (
                  <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {(r.material as any)?.image_url && (
                        <img src={(r.material as any).image_url} alt={r.material?.nome} className="h-10 w-10 rounded object-cover border" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{r.material?.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.quantidade.toLocaleString()} {r.material?.unidade} · {formatDate(r.reserved_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === "reserved" ? (
                        <div className="text-right space-y-1">
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50 text-xs">
                            <Clock className="h-3 w-3" /> Reservado
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">Até {formatDate(r.expires_at)}</p>
                          <div className="flex justify-end items-center gap-1">
                            <CountdownTimer expiresAt={r.expires_at} />
                          </div>
                        </div>
                      ) : r.status === "withdrawn" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1 text-xs">
                          <BookmarkCheck className="h-3 w-3" /> Retirado
                        </Badge>
                      ) : r.status === "expired" ? (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" /> Expirado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Cancelado</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
