import { useState } from "react";
import { GitBranch, Crown, Plus, Users, Award, Target, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  useCoordinators, 
  useLeaderTree, 
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
  const [searchTerm, setSearchTerm] = useState("");
  const [demoteConfirm, setDemoteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: coordinators, isLoading: loadingCoordinators } = useCoordinators();
  const { data: tree, isLoading: loadingTree } = useLeaderTree(selectedCoordinatorId);
  const demoteCoordinator = useDemoteCoordinator();

  const selectedCoordinator = coordinators?.find(c => c.id === selectedCoordinatorId);

  // Filtrar coordenadores por nome, email ou telefone
  const filteredCoordinators = coordinators?.filter((coordinator) => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase().trim();
    const searchDigits = search.replace(/\D/g, "");
    
    const matchesName = coordinator.nome_completo?.toLowerCase().includes(search);
    const matchesEmail = coordinator.email?.toLowerCase().includes(search);
    const matchesPhone = searchDigits.length >= 4 && 
      coordinator.telefone?.replace(/\D/g, "").includes(searchDigits);
    
    return matchesName || matchesEmail || matchesPhone;
  });

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
                {coordinators?.reduce((sum, c) => sum + c.total_cadastros, 0) || 0}
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
                {coordinators?.reduce((sum, c) => sum + c.total_pontos, 0) || 0}
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
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loadingCoordinators ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCoordinators?.length === 0 && searchTerm ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground p-4">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm text-center">Nenhum coordenador encontrado</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpar busca
                  </Button>
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
                  {filteredCoordinators?.map((coordinator) => (
                    <CoordinatorCard
                      key={coordinator.id}
                      coordinator={coordinator}
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
            {selectedCoordinator && (
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedCoordinator.total_leaders} líderes
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {selectedCoordinator.total_cadastros} cadastros
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {selectedCoordinator.total_pontos} pontos
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
