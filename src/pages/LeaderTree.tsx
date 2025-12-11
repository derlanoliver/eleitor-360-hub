import { useState } from "react";
import { GitBranch, Crown, Plus, Users, Award, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  useCoordinators, 
  useLeaderTree, 
  useCoordinatorStats,
  useDemoteCoordinator 
} from "@/hooks/leaders/useLeaderTree";
import { CoordinatorCard } from "@/components/leaders/CoordinatorCard";
import { LeaderTreeView } from "@/components/leaders/LeaderTreeView";
import { PromoteToCoordinatorDialog } from "@/components/leaders/PromoteToCoordinatorDialog";
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

export default function LeaderTree() {
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | null>(null);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [demoteConfirm, setDemoteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: coordinators, isLoading: loadingCoordinators } = useCoordinators();
  const { data: tree, isLoading: loadingTree } = useLeaderTree(selectedCoordinatorId);
  const { data: stats } = useCoordinatorStats(selectedCoordinatorId);
  const demoteCoordinator = useDemoteCoordinator();

  const selectedCoordinator = coordinators?.find(c => c.id === selectedCoordinatorId);

  const handleDemote = async () => {
    if (!demoteConfirm) return;
    await demoteCoordinator.mutateAsync(demoteConfirm.id);
    if (selectedCoordinatorId === demoteConfirm.id) {
      setSelectedCoordinatorId(null);
    }
    setDemoteConfirm(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            Árvore de Lideranças
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a hierarquia multinível de coordenadores e líderes
          </p>
        </div>
        <Button onClick={() => setShowPromoteDialog(true)} className="gap-2">
          <Crown className="h-4 w-4" />
          Novo Coordenador
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coordinators?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Coordenadores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {coordinators?.reduce((sum, c) => sum + c.cadastros, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Cadastros Totais</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {coordinators?.reduce((sum, c) => sum + c.pontuacao_total, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Pontos Totais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Coordinators List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Coordenadores
            </CardTitle>
            <CardDescription>
              Selecione um coordenador para ver sua árvore
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loadingCoordinators ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : coordinators?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground p-4">
                  <Crown className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm text-center">Nenhum coordenador cadastrado</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => setShowPromoteDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Promover primeiro coordenador
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {coordinators?.map((coordinator) => (
                    <CoordinatorCard
                      key={coordinator.id}
                      coordinator={coordinator}
                      stats={selectedCoordinatorId === coordinator.id ? stats : null}
                      isSelected={selectedCoordinatorId === coordinator.id}
                      onSelect={() => setSelectedCoordinatorId(coordinator.id)}
                      onDemote={() => setDemoteConfirm({ id: coordinator.id, name: coordinator.nome_completo })}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tree View */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              {selectedCoordinator ? (
                <>Hierarquia de {selectedCoordinator.nome_completo}</>
              ) : (
                <>Visualização da Árvore</>
              )}
            </CardTitle>
            {selectedCoordinator && stats && (
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {stats.total_leaders} líderes
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {stats.total_cadastros} cadastros
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {stats.total_pontos} pontos
                </span>
              </CardDescription>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {!selectedCoordinatorId ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mb-4 opacity-30" />
                  <p>Selecione um coordenador para ver sua árvore</p>
                </div>
              ) : loadingTree ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tree ? (
                <LeaderTreeView tree={tree} />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-30" />
                  <p>Nenhum subordinado nesta árvore</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Promote Dialog */}
      <PromoteToCoordinatorDialog
        open={showPromoteDialog}
        onOpenChange={setShowPromoteDialog}
      />

      {/* Demote Confirmation */}
      <AlertDialog open={!!demoteConfirm} onOpenChange={() => setDemoteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rebaixar Coordenador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rebaixar <strong>{demoteConfirm?.name}</strong>?
              <span className="block mt-2 text-amber-600">
                Todos os líderes subordinados serão desvinculados da hierarquia.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDemote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rebaixar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
