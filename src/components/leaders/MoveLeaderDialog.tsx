import { useState, useMemo } from "react";
import { Search, Crown, User, ChevronRight, AlertTriangle, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  useCoordinators, 
  useLeaderTree, 
  useMoveLeaderBranch,
  LeaderTreeNode 
} from "@/hooks/leaders/useLeaderTree";

interface MoveLeaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaderId: string;
  leaderName: string;
  currentLevel: number;
  currentParentId: string | null;
  subordinatesCount: number;
}

export function MoveLeaderDialog({
  open,
  onOpenChange,
  leaderId,
  leaderName,
  currentLevel,
  currentParentId,
  subordinatesCount,
}: MoveLeaderDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const { data: coordinators, isLoading: loadingCoordinators } = useCoordinators();
  const { data: selectedTree, isLoading: loadingTree } = useLeaderTree(selectedCoordinatorId);
  const moveLeaderBranch = useMoveLeaderBranch();

  // Filter coordinators by search
  const filteredCoordinators = useMemo(() => {
    if (!coordinators) return [];
    if (!searchTerm) return coordinators;
    
    const term = searchTerm.toLowerCase();
    const phoneDigits = searchTerm.replace(/\D/g, "");
    
    return coordinators.filter((c) => {
      const matchName = c.nome_completo.toLowerCase().includes(term);
      const matchEmail = c.email?.toLowerCase().includes(term);
      const matchPhone = phoneDigits.length >= 4 && c.telefone?.replace(/\D/g, "").includes(phoneDigits);
      return matchName || matchEmail || matchPhone;
    });
  }, [coordinators, searchTerm]);

  // Get flat list of possible parents from selected tree (excluding the leader being moved and its subordinates)
  const possibleParents = useMemo(() => {
    if (!selectedTree) return [];
    
    const parents: { id: string; name: string; level: number }[] = [];
    
    const collectParents = (node: LeaderTreeNode, isSubordinateOfMoved: boolean = false) => {
      // Skip if this is the leader being moved or a subordinate of it
      if (node.id === leaderId) {
        // Mark all children as subordinates
        node.children?.forEach(child => collectParents(child, true));
        return;
      }
      
      if (isSubordinateOfMoved) return;
      
      // Only include if adding wouldn't exceed level 4
      if (node.hierarchy_level && node.hierarchy_level < 4) {
        parents.push({
          id: node.id,
          name: node.nome_completo,
          level: node.hierarchy_level,
        });
      }
      
      node.children?.forEach(child => collectParents(child, false));
    };
    
    collectParents(selectedTree);
    return parents;
  }, [selectedTree, leaderId]);

  // Calculate new level based on selection
  const newLevel = useMemo(() => {
    if (!selectedParentId) return null;
    const parent = possibleParents.find(p => p.id === selectedParentId);
    return parent ? parent.level + 1 : null;
  }, [selectedParentId, possibleParents]);

  // Check if move would exceed depth limit
  const wouldExceedLimit = useMemo(() => {
    if (!newLevel) return false;
    // Current subtree depth = (4 - currentLevel) at most
    const subtreeDepth = 4 - currentLevel;
    return (newLevel + subtreeDepth) > 4;
  }, [newLevel, currentLevel]);

  const handleSelectCoordinator = (coordinatorId: string) => {
    setSelectedCoordinatorId(coordinatorId);
    setSelectedParentId(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedCoordinatorId(null);
    setSelectedParentId(null);
  };

  const handleConfirm = async () => {
    if (!selectedParentId) return;
    
    try {
      await moveLeaderBranch.mutateAsync({
        leaderId,
        newParentId: selectedParentId,
      });
      onOpenChange(false);
      resetState();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetState = () => {
    setStep(1);
    setSearchTerm("");
    setSelectedCoordinatorId(null);
    setSelectedParentId(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return "Coordenador";
      case 2: return "Nível 2";
      case 3: return "Nível 3";
      case 4: return "Nível 4";
      default: return `Nível ${level}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Mover Líder para Outra Árvore
          </DialogTitle>
          <DialogDescription>
            Mover <strong>{leaderName}</strong> (Nível {currentLevel}) 
            {subordinatesCount > 0 && ` e ${subordinatesCount} subordinado(s)`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar coordenador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {loadingCoordinators ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando coordenadores...
                </div>
              ) : filteredCoordinators.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum coordenador encontrado
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCoordinators.map((coordinator) => {
                    // Skip if this is the current parent's coordinator
                    const isCurrentTree = coordinator.id === currentParentId || 
                      (selectedTree && selectedTree.id === coordinator.id);
                    
                    return (
                      <button
                        key={coordinator.id}
                        onClick={() => handleSelectCoordinator(coordinator.id)}
                        className="w-full p-3 rounded-lg border hover:bg-accent transition-colors text-left flex items-center gap-3"
                      >
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Crown className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{coordinator.nome_completo}</div>
                          <div className="text-sm text-muted-foreground">
                            {coordinator.total_leaders} líderes · {coordinator.total_pontos} pts
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {step === 2 && (
          <>
            <Button variant="ghost" size="sm" onClick={handleBack} className="w-fit -mt-2">
              ← Voltar aos coordenadores
            </Button>

            {loadingTree ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando árvore...
              </div>
            ) : possibleParents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Não há posições disponíveis nesta árvore
              </div>
            ) : (
              <ScrollArea className="h-[280px] pr-4">
                <RadioGroup
                  value={selectedParentId || ""}
                  onValueChange={setSelectedParentId}
                  className="space-y-2"
                >
                  {possibleParents.map((parent) => {
                    const wouldExceed = (parent.level + 1 + (4 - currentLevel)) > 4;
                    const isCurrentParent = parent.id === currentParentId;
                    
                    return (
                      <div
                        key={parent.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          isCurrentParent ? "opacity-50" : "hover:bg-accent"
                        } transition-colors`}
                      >
                        <RadioGroupItem 
                          value={parent.id} 
                          id={parent.id} 
                          disabled={isCurrentParent || wouldExceed}
                        />
                        <Label 
                          htmlFor={parent.id} 
                          className="flex-1 flex items-center gap-2 cursor-pointer"
                        >
                          {parent.level === 1 ? (
                            <Crown className="h-4 w-4 text-amber-600" />
                          ) : (
                            <User className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="flex-1">{parent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getLevelLabel(parent.level)}
                          </Badge>
                          {isCurrentParent && (
                            <Badge variant="secondary" className="text-xs">
                              Atual
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </ScrollArea>
            )}

            {selectedParentId && newLevel && (
              <div className="space-y-2">
                {wouldExceedLimit ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Este movimento excederia o limite de 4 níveis de hierarquia.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertDescription>
                      <strong>{leaderName}</strong> passará para o <strong>Nível {newLevel}</strong>
                      {subordinatesCount > 0 && (
                        <span> e os {subordinatesCount} subordinados terão seus níveis recalculados.</span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          {step === 2 && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedParentId || wouldExceedLimit || moveLeaderBranch.isPending}
            >
              {moveLeaderBranch.isPending ? "Movendo..." : "Confirmar Movimento"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}