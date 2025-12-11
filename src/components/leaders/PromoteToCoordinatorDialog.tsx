import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAvailableLeaders, usePromoteToCoordinator } from "@/hooks/leaders/useLeaderTree";
import { Search, Crown, User, Loader2 } from "lucide-react";

interface PromoteToCoordinatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromoteToCoordinatorDialog({ open, onOpenChange }: PromoteToCoordinatorDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  
  const { data: availableLeaders, isLoading } = useAvailableLeaders();
  const promoteToCoordinator = usePromoteToCoordinator();

  const filteredLeaders = availableLeaders?.filter(leader =>
    leader.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
    leader.email?.toLowerCase().includes(search.toLowerCase()) ||
    leader.telefone?.includes(search)
  );

  const handlePromote = async () => {
    if (!selectedLeaderId) return;
    
    await promoteToCoordinator.mutateAsync(selectedLeaderId);
    setSelectedLeaderId(null);
    setSearch("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedLeaderId(null);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Promover a Coordenador
          </DialogTitle>
          <DialogDescription>
            Selecione um líder para promover a coordenador. Coordenadores são o topo da hierarquia e podem ter líderes subordinados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLeaders?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <User className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">
                  {search ? "Nenhum líder encontrado" : "Não há líderes disponíveis para promoção"}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredLeaders?.map((leader) => (
                  <button
                    key={leader.id}
                    onClick={() => setSelectedLeaderId(leader.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedLeaderId === leader.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "hover:bg-muted border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{leader.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">
                          {leader.cidade?.nome || "Sem região"}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">{leader.cadastros} cadastros</p>
                        <p className="text-primary font-medium">{leader.pontuacao_total} pts</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePromote} 
            disabled={!selectedLeaderId || promoteToCoordinator.isPending}
            className="gap-2"
          >
            {promoteToCoordinator.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Crown className="h-4 w-4" />
            Promover a Coordenador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
