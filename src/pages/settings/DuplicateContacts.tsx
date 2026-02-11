import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Trash2, AlertTriangle, Users, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPhoneToBR } from "@/utils/phoneNormalizer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DuplicateRecord {
  contact_id: string;
  contact_nome: string;
  contact_telefone: string;
  leader_id: string;
  leader_nome: string;
  leader_telefone: string;
  leader_active: boolean;
}

function useDuplicateContacts() {
  return useQuery({
    queryKey: ["duplicate-contacts-leaders"],
    queryFn: async (): Promise<DuplicateRecord[]> => {
      // Fetch all active contacts with phone
      const allContacts: any[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("office_contacts")
          .select("id, nome, telefone_norm")
          .eq("is_active", true)
          .range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allContacts.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      // Fetch all leaders with phone
      const allLeaders: any[] = [];
      from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("lideres")
          .select("id, nome_completo, telefone, is_active")
          .not("telefone", "is", null)
          .range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allLeaders.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      // Build leader map by last 8 digits
      const leaderByPhone = new Map<string, any>();
      for (const l of allLeaders) {
        const digits = (l.telefone || "").replace(/\D/g, "");
        const last8 = digits.slice(-8);
        if (last8.length === 8) {
          leaderByPhone.set(last8, l);
        }
      }

      // Match
      const duplicates: DuplicateRecord[] = [];
      for (const c of allContacts) {
        const digits = (c.telefone_norm || "").replace(/\D/g, "");
        const last8 = digits.slice(-8);
        if (last8.length === 8) {
          const leader = leaderByPhone.get(last8);
          if (leader) {
            duplicates.push({
              contact_id: c.id,
              contact_nome: c.nome,
              contact_telefone: c.telefone_norm,
              leader_id: leader.id,
              leader_nome: leader.nome_completo,
              leader_telefone: leader.telefone,
              leader_active: leader.is_active,
            });
          }
        }
      }

      return duplicates.sort((a, b) => a.contact_nome.localeCompare(b.contact_nome));
    },
    staleTime: 1000 * 60 * 5,
  });
}

const DuplicateContacts = () => {
  const { data: duplicates, isLoading } = useDuplicateContacts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    if (!duplicates) return [];
    if (!search.trim()) return duplicates;
    const q = search.toLowerCase();
    return duplicates.filter(
      (d) =>
        d.contact_nome.toLowerCase().includes(q) ||
        d.leader_nome.toLowerCase().includes(q) ||
        d.contact_telefone.includes(q)
    );
  }, [duplicates, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((d) => d.contact_id)));
    }
  };

  const deactivateMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      // Deactivate in batches of 50
      for (let i = 0; i < contactIds.length; i += 50) {
        const batch = contactIds.slice(i, i + 50);
        const { error } = await supabase
          .from("office_contacts")
          .update({ is_active: false })
          .in("id", batch);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duplicate-contacts-leaders"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setSelected(new Set());
      toast({
        title: "Contatos desativados",
        description: `${selected.size} contato(s) duplicado(s) foram desativados com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao desativar contatos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDeactivate = () => {
    setShowConfirm(false);
    deactivateMutation.mutate(Array.from(selected));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Duplicidades: Contatos × Lideranças</h1>
          <p className="text-muted-foreground text-sm">
            Contatos ativos que também possuem cadastro como líder (mesmo telefone)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="text-lg">
                  {isLoading ? "Carregando..." : `${duplicates?.length ?? 0} duplicidades encontradas`}
                </CardTitle>
                <CardDescription>
                  Selecione os contatos que deseja desativar (o cadastro de líder será mantido)
                </CardDescription>
              </div>
            </div>
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Desativar {selected.size} selecionado(s)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-md overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Líder correspondente</TableHead>
                    <TableHead>Status líder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {search ? "Nenhum resultado encontrado" : "Nenhuma duplicidade encontrada"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <TableRow key={d.contact_id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(d.contact_id)}
                            onCheckedChange={() => toggleSelect(d.contact_id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{d.contact_nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatPhoneToBR(d.contact_telefone)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm">{d.leader_nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={d.leader_active ? "default" : "secondary"}>
                            {d.leader_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar contatos duplicados?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a desativar <strong>{selected.size}</strong> contato(s) que já possuem
              cadastro como líder. O cadastro de liderança será mantido. Esta ação pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>
              Confirmar desativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DuplicateContacts;
