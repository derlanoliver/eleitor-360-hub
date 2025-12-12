import { useState } from "react";
import { Crown, User, UserPlus, UserMinus, ChevronDown, ChevronRight, MoreVertical, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LeaderTreeNode, useRemoveFromTree, usePromoteToCoordinatorWithSubordinates, countSubordinates } from "@/hooks/leaders/useLeaderTree";
import { AddSubordinateDialog } from "./AddSubordinateDialog";
import { MoveLeaderDialog } from "./MoveLeaderDialog";
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

interface LeaderTreeViewProps {
  tree: LeaderTreeNode;
  highlightLeaderId?: string | null;
}

export function LeaderTreeView({ tree, highlightLeaderId }: LeaderTreeViewProps) {
  return (
    <div className="p-4">
      <TreeNode node={tree} isRoot highlightLeaderId={highlightLeaderId} />
    </div>
  );
}

interface TreeNodeProps {
  node: LeaderTreeNode;
  isRoot?: boolean;
  highlightLeaderId?: string | null;
}

function TreeNode({ node, isRoot = false, highlightLeaderId }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  
  const removeFromTree = useRemoveFromTree();
  const promoteToCoordinator = usePromoteToCoordinatorWithSubordinates();
  const subordinatesCount = countSubordinates(node);
  
  const hasChildren = node.children && node.children.length > 0;
  const level = node.hierarchy_level || 1;
  const isHighlighted = highlightLeaderId === node.id;
  
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return "bg-amber-100 text-amber-700 border-amber-300";
      case 2: return "bg-blue-100 text-blue-700 border-blue-300";
      case 3: return "bg-green-100 text-green-700 border-green-300";
      case 4: return "bg-purple-100 text-purple-700 border-purple-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return "Coordenador";
      case 2: return "Nível 1";
      case 3: return "Nível 2";
      case 4: return "Nível 3";
      default: return "Líder";
    }
  };

  const getLevelIcon = (level: number) => {
    if (level === 1) return <Crown className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const handleRemove = async () => {
    await removeFromTree.mutateAsync(node.id);
    setShowRemoveDialog(false);
  };

  const handlePromoteToCoordinator = async () => {
    await promoteToCoordinator.mutateAsync(node.id);
    setShowPromoteDialog(false);
  };

  return (
    <div className="relative">
      {/* Connection line to parent */}
      {!isRoot && (
        <div className="absolute left-[-20px] top-0 h-6 w-5 border-l-2 border-b-2 border-muted-foreground/30 rounded-bl-lg" />
      )}
      
      {/* Node */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${getLevelColor(level)} mb-2 ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''}`}>
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getLevelIcon(level)}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{node.nome_completo}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {getLevelLabel(level)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{node.cadastros} cadastros</span>
              <span>{node.pontuacao_total} pts</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {level < 4 && (
              <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Subordinado
              </DropdownMenuItem>
            )}
            {!isRoot && (
              <>
                <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Mover para Outra Árvore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPromoteDialog(true)}>
                  <Crown className="h-4 w-4 mr-2" />
                  Promover a Coordenador
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowRemoveDialog(true)}
                  className="text-destructive"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remover da Hierarquia
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-8 border-l-2 border-muted-foreground/20 pl-4">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} highlightLeaderId={highlightLeaderId} />
          ))}
        </div>
      )}

      {/* Add Subordinate Dialog */}
      <AddSubordinateDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        parentId={node.id}
        parentName={node.nome_completo}
        parentLevel={level}
      />

      {/* Move Leader Dialog */}
      <MoveLeaderDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        leaderId={node.id}
        leaderName={node.nome_completo}
        currentLevel={level}
        currentParentId={node.parent_leader_id}
        subordinatesCount={subordinatesCount}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da Hierarquia</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{node.nome_completo}</strong> da hierarquia?
              {hasChildren && (
                <span className="block mt-2 text-amber-600">
                  Os subordinados diretos serão reassociados ao líder superior.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote to Coordinator Dialog */}
      <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover a Coordenador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja promover <strong>{node.nome_completo}</strong> a Coordenador?
              {subordinatesCount > 0 && (
                <span className="block mt-2 text-blue-600">
                  {subordinatesCount} subordinado(s) serão mantidos e terão seus níveis ajustados automaticamente.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePromoteToCoordinator}
              disabled={promoteToCoordinator.isPending}
            >
              {promoteToCoordinator.isPending ? "Promovendo..." : "Promover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
