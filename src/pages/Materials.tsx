import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, ArrowDownToLine, BarChart3, CheckCircle2, AlertTriangle, PackagePlus, Clock, BookmarkCheck } from "lucide-react";
import { useCampaignMaterials } from "@/hooks/materials/useCampaignMaterials";
import { useMaterialWithdrawals, useConfirmWithdrawal } from "@/hooks/materials/useMaterialWithdrawals";
import { useMaterialReservations } from "@/hooks/materials/useMaterialReservations";
import { AddMaterialDialog } from "@/components/materials/AddMaterialDialog";
import { AddStockDialog } from "@/components/materials/AddStockDialog";
import { RegisterWithdrawalDialog } from "@/components/materials/RegisterWithdrawalDialog";
import type { CampaignMaterial } from "@/hooks/materials/useCampaignMaterials";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";

function ReservationCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = differenceInSeconds(new Date(expiresAt), new Date());
      if (diff <= 0) { setTimeLeft("Expirado"); return; }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${d}d ${h.toString().padStart(2,"0")}h ${m.toString().padStart(2,"0")}m ${s.toString().padStart(2,"0")}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  const isExpiring = differenceInSeconds(new Date(expiresAt), new Date()) < 86400;
  return <span className={`font-mono text-xs ${isExpiring ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{timeLeft}</span>;
}

export default function Materials() {
  const [tab, setTab] = useState("materiais");
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<CampaignMaterial | null>(null);

  const { data: materials, isLoading: loadingMaterials } = useCampaignMaterials();
  const { data: withdrawals, isLoading: loadingWithdrawals } = useMaterialWithdrawals();
  const { data: reservations, isLoading: loadingReservations } = useMaterialReservations();
  const confirmWithdrawal = useConfirmWithdrawal();

  const activeReservations = useMemo(() => (reservations || []).filter(r => r.status === "reserved"), [reservations]);

  // Stats
  const totalProduzido = useMemo(() => (materials || []).reduce((s, m) => s + m.quantidade_produzida, 0), [materials]);
  const totalEstoque = useMemo(() => (materials || []).reduce((s, m) => s + m.estoque_atual, 0), [materials]);
  const totalDistribuido = totalProduzido - totalEstoque;
  const totalRetiradas = (withdrawals || []).length;

  // Report data
  const withdrawalsByLeader = useMemo(() => {
    const map: Record<string, { nome: string; cargo: string; regiao: string; total: number }> = {};
    (withdrawals || []).forEach(w => {
      const key = w.leader_id;
      if (!map[key]) {
        map[key] = {
          nome: w.leader?.nome_completo || "—",
          cargo: w.leader?.is_coordinator ? "Coordenador" : "Líder",
          regiao: w.leader_city?.nome || "—",
          total: 0,
        };
      }
      map[key].total += w.quantidade;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [withdrawals]);

  const withdrawalsByRegion = useMemo(() => {
    const map: Record<string, number> = {};
    (withdrawals || []).forEach(w => {
      const reg = w.leader_city?.nome || "Sem região";
      map[reg] = (map[reg] || 0) + w.quantidade;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([regiao, total]) => ({ regiao, total }));
  }, [withdrawals]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Materiais</h1>
          <p className="text-muted-foreground">Gerencie produção, estoque e distribuição de materiais de campanha</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddMaterialOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Material
          </Button>
          <Button onClick={() => setWithdrawalOpen(true)}>
            <ArrowDownToLine className="h-4 w-4 mr-1" /> Registrar Retirada
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Produzido</p>
                <p className="text-xl font-bold">{totalProduzido.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><PackagePlus className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Em Estoque</p>
                <p className="text-xl font-bold">{totalEstoque.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><ArrowDownToLine className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Distribuído</p>
                <p className="text-xl font-bold">{totalDistribuido.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100"><BarChart3 className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Retiradas</p>
                <p className="text-xl font-bold">{totalRetiradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="reservas">
            Reservas {activeReservations.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{activeReservations.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="retiradas">Retiradas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* === MATERIAIS TAB === */}
        <TabsContent value="materiais">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Produzido</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Distribuído</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingMaterials ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : (materials || []).length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum material cadastrado</TableCell></TableRow>
                  ) : (materials || []).map(m => {
                    const dist = m.quantidade_produzida - m.estoque_atual;
                    const lowStock = m.estoque_atual <= m.quantidade_produzida * 0.1;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          {m.image_url ? (
                            <img src={m.image_url} alt={m.nome} className="h-10 w-10 rounded object-cover border" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{m.nome}</TableCell>
                        <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                        <TableCell className="text-right">{m.quantidade_produzida.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <span className={lowStock ? "text-red-600 font-semibold" : ""}>{m.estoque_atual.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-right">{dist.toLocaleString()}</TableCell>
                        <TableCell>
                          {lowStock ? (
                            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Estoque Baixo</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedMaterial(m); setAddStockOpen(true); }}>
                            <PackagePlus className="h-4 w-4 mr-1" /> Estoque
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === RESERVAS TAB === */}
        <TabsContent value="reservas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Quem Reservou</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tempo Restante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReservations ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : (reservations || []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma reserva registrada</TableCell></TableRow>
                  ) : (reservations || []).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.material?.nome}</TableCell>
                      <TableCell>{r.leader?.nome_completo}</TableCell>
                      <TableCell><Badge variant="outline">{r.leader?.is_coordinator ? "Coordenador" : "Líder"}</Badge></TableCell>
                      <TableCell>{r.leader_city?.nome || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{r.quantidade.toLocaleString()}</TableCell>
                      <TableCell>
                        {r.status === "reserved" ? (
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
                            <Clock className="h-3 w-3" /> Reservado
                          </Badge>
                        ) : r.status === "withdrawn" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                            <BookmarkCheck className="h-3 w-3" /> Retirado
                          </Badge>
                        ) : r.status === "expired" ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> Expirado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Cancelado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.status === "reserved" ? (
                          <ReservationCountdown expiresAt={r.expires_at} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === RETIRADAS TAB === */}
        <TabsContent value="retiradas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quem Retirou</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Confirmação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingWithdrawals ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : (withdrawals || []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma retirada registrada</TableCell></TableRow>
                  ) : (withdrawals || []).map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="text-sm">{format(new Date(w.data_retirada), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{w.material?.nome}</TableCell>
                      <TableCell>{w.leader?.nome_completo}</TableCell>
                      <TableCell><Badge variant="outline">{w.leader?.is_coordinator ? "Coordenador" : "Líder"}</Badge></TableCell>
                      <TableCell>{w.leader_city?.nome || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{w.quantidade.toLocaleString()}</TableCell>
                      <TableCell>
                        {w.confirmado ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Confirmado
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => confirmWithdrawal.mutate(w.id)}>
                            Confirmar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === RELATÓRIOS TAB === */}
        <TabsContent value="relatorios">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top retiradas por pessoa */}
            <Card>
              <CardHeader><CardTitle className="text-base">Retiradas por Pessoa</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalsByLeader.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Sem dados</TableCell></TableRow>
                    ) : withdrawalsByLeader.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell><Badge variant="outline">{r.cargo}</Badge></TableCell>
                        <TableCell>{r.regiao}</TableCell>
                        <TableCell className="text-right font-semibold">{r.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Distribuição por região */}
            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição por Região</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Região</TableHead>
                      <TableHead className="text-right">Total Distribuído</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalsByRegion.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">Sem dados</TableCell></TableRow>
                    ) : withdrawalsByRegion.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.regiao}</TableCell>
                        <TableCell className="text-right font-semibold">{r.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Estoque disponível */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Estoque Disponível por Material</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Produzido</TableHead>
                      <TableHead className="text-right">Distribuído</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">% Distribuído</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(materials || []).map(m => {
                      const dist = m.quantidade_produzida - m.estoque_atual;
                      const pct = m.quantidade_produzida > 0 ? Math.round((dist / m.quantidade_produzida) * 100) : 0;
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.nome}</TableCell>
                          <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                          <TableCell className="text-right">{m.quantidade_produzida.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{dist.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold">{m.estoque_atual.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{pct}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddMaterialDialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen} />
      <AddStockDialog open={addStockOpen} onOpenChange={setAddStockOpen} material={selectedMaterial} />
      <RegisterWithdrawalDialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen} />
    </div>
  );
}
