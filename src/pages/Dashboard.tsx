import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trophy, Phone, Users, MapPin, Calendar, Activity, TrendingUp, Building2, ClipboardList, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { RankingChart } from "@/components/dashboard/RankingChart";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { ProfileStats } from "@/components/dashboard/ProfileStats";
import { useDashboardStats } from "@/hooks/dashboard/useDashboardStats";
import { useTopLeaders } from "@/hooks/dashboard/useTopLeaders";
import { useProfileStats } from "@/hooks/dashboard/useProfileStats";
import { useTemasRanking } from "@/hooks/dashboard/useTemasRanking";
import { useCitiesRanking } from "@/hooks/dashboard/useCitiesRanking";
import { useOfficeStats } from "@/hooks/dashboard/useOfficeStats";
import { formatRelativeTime } from "@/lib/dateUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LeaderLevelBadge, LeaderLevelProgress } from "@/components/leaders/LeaderLevelBadge";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { TutorialButton } from "@/components/TutorialButton";
import { Step } from "react-joyride";
import { useDemoMask } from "@/contexts/DemoModeContext";


// Tutorial steps for Dashboard
const dashboardTutorialSteps: Step[] = [
  {
    target: '[data-tutorial="dashboard-header"]',
    title: "👋 Bem-vindo ao Dashboard!",
    content: "Esta é a visão geral do sistema. Aqui você acompanha os principais indicadores, rankings de lideranças e métricas de desempenho.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="refresh-button"]',
    title: "🔄 Atualizar Dados",
    content: "Clique aqui para recarregar todos os dados do dashboard em tempo real. Os dados serão buscados novamente do banco de dados.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="ranking-top5"]',
    title: "🏆 Ranking TOP 5",
    content: "Veja os líderes com melhor desempenho do mês. O pódio mostra as 3 primeiras posições com troféus de ouro, prata e bronze. Você pode ativar/desativar líderes e enviar WhatsApp diretamente daqui.",
    placement: "right",
  },
  {
    target: '[data-tutorial="ranking-ra"]',
    title: "📍 Ranking por Região",
    content: "Gráfico mostrando quais Regiões Administrativas têm mais cadastros. Use os filtros (7d, 30d, 90d, 1a) para alterar o período de análise.",
    placement: "top",
  },
  {
    target: '[data-tutorial="ranking-temas"]',
    title: "📊 Ranking por Temas",
    content: "Veja quais temas e pautas estão gerando mais engajamento e cadastros. Isso ajuda a entender os interesses do público.",
    placement: "top",
  },
  {
    target: '[data-tutorial="stats-gerais"]',
    title: "📈 Estatísticas Gerais",
    content: "Resumo com total de cadastros, cidades/RAs alcançadas, líderes ativos e quando foi o último cadastro no sistema.",
    placement: "left",
  },
  {
    target: '[data-tutorial="perfil-stats"]',
    title: "👥 Perfil dos Cadastrados",
    content: "Análise demográfica dos seus cadastros: distribuição por gênero (masculino, feminino, não informado) apresentada de forma visual.",
    placement: "left",
  },
  {
    target: '[data-tutorial="gabinete"]',
    title: "🏛️ Atendimento do Gabinete",
    content: "Métricas do gabinete: total de visitas, aguardando atendimento, reuniões realizadas e a taxa de aceite. Também mostra os próximos na fila.",
    placement: "left",
  },
  {
    target: '[data-tutorial="acoes-rapidas"]',
    title: "⚡ Ações Rápidas",
    content: "Atalhos para as funcionalidades mais usadas: ver todos os líderes, criar eventos e gerar relatórios detalhados.",
    placement: "left",
  },
];

const Dashboard = () => {
  const [periodRA, setPeriodRA] = useState("30d");
  const [periodTemas, setPeriodTemas] = useState("30d");
  const queryClient = useQueryClient();
  const { m } = useDemoMask();

  // Tutorial hook
  const { restartTutorial } = useTutorial("dashboard", dashboardTutorialSteps);

  // Buscar dados reais do banco
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: topLeaders = [], isLoading: leadersLoading } = useTopLeaders();
  const { data: profileStats, isLoading: profileLoading } = useProfileStats();
  const { data: temasRanking = [], isLoading: temasLoading } = useTemasRanking();
  const { data: citiesRanking = [], isLoading: citiesLoading } = useCitiesRanking();
  const { data: officeStats } = useOfficeStats();

  // Mutation para atualizar status do líder
  const toggleLeaderMutation = useMutation({
    mutationFn: async ({ leaderId, isActive }: { leaderId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("lideres")
        .update({ is_active: !isActive })
        .eq("id", leaderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["top_leaders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      toast({
        title: "✅ Status atualizado",
        description: "O status do líder foi alterado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao atualizar",
        description: error.message || "Não foi possível alterar o status",
        variant: "destructive",
      });
    },
  });

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
    queryClient.invalidateQueries({ queryKey: ["top_leaders"] });
    queryClient.invalidateQueries({ queryKey: ["profile_stats"] });
    queryClient.invalidateQueries({ queryKey: ["temas_ranking"] });
    queryClient.invalidateQueries({ queryKey: ["cities_ranking"] });
    queryClient.invalidateQueries({ queryKey: ["office_stats"] });
    
    toast({
      title: "Dados atualizados",
      description: "Os dados do dashboard foram recarregados com sucesso",
    });
  };

  const handleWhatsAppClick = (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${normalizedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const toggleLeaderStatus = (leaderId: string, isActive: boolean) => {
    toggleLeaderMutation.mutate({ leaderId, isActive });
  };

  const getTrophyColor = (position: number) => {
    switch (position) {
      case 1: return "text-yellow-500"; // Ouro
      case 2: return "text-gray-400"; // Prata
      case 3: return "text-orange-600"; // Bronze
      default: return "text-gray-300";
    }
  };

  const getTrophyBg = (position: number) => {
    switch (position) {
      case 1: return "bg-yellow-50 border-yellow-200"; // Ouro
      case 2: return "bg-gray-50 border-gray-200"; // Prata
      case 3: return "bg-orange-50 border-orange-200"; // Bronze
      default: return "bg-gray-50";
    }
  };

  const podiumLeaders = topLeaders.slice(0, 3);
  const listLeaders = topLeaders.slice(3, 5);

  // Preparar dados dos gráficos com mascaramento
  const raChartData = citiesRanking.slice(0, 8).map(item => ({
    name: m.city(item.name),
    value: m.number(item.value, "ra_" + item.name),
  }));
  const temasChartData = temasRanking.slice(0, 8).map(item => ({
    name: item.tema,
    value: m.number(item.cadastros, "tema_" + item.tema),
  }));

  const isLoading = statsLoading || leadersLoading || profileLoading || temasLoading || citiesLoading;

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      {/* Tutorial Overlay */}
      <TutorialOverlay page="dashboard" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8" data-tutorial="dashboard-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Visão geral do desempenho e ranking de lideranças
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TutorialButton onClick={restartTutorial} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={isLoading}
                className="flex items-center gap-2"
                data-tutorial="refresh-button"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Ranking de Lideranças - Pódio + TOP 5 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6" data-tutorial="ranking-top5">
            <Card className="card-default">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-primary-600 mr-2" />
                    Ranking de Lideranças - TOP 5
                  </div>
                  <Link to="/leaders/ranking">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver ranking completo">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {/* Pódio TOP 3 */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🏆 Pódio do Mês</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {podiumLeaders.map((leader) => (
                      <div
                        key={leader.id}
                        className={`relative p-4 rounded-lg border-2 ${getTrophyBg(leader.position)}`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${getTrophyBg(leader.position)}`}>
                            <Trophy className={`h-6 w-6 ${getTrophyColor(leader.position)}`} />
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full ${
                              leader.position === 1 ? 'bg-yellow-500' : 
                              leader.position === 2 ? 'bg-gray-400' : 'bg-orange-600'
                            }`}>
                              {leader.position}º
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {m.name(leader.name)}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">{m.city(leader.region)}</p>
                          <LeaderLevelBadge points={leader.points} size="sm" />
                          <div className="mt-2 text-center">
                            <span className="text-lg font-bold text-primary-600">{m.number(leader.points, leader.name + '_pts')}</span>
                            <span className="text-xs text-muted-foreground ml-1">pts</span>
                            <span className="text-xs text-muted-foreground mx-1">•</span>
                            <span className="text-xs text-muted-foreground">{m.number(leader.indicacoes, leader.name + '_ind')} ind</span>
                          </div>
                          <LeaderLevelProgress points={leader.points} showLabel={false} className="mt-2" />
                          {leader.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsAppClick(leader.phone)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-auto mt-2"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              <span className="text-xs">WhatsApp</span>
                            </Button>
                          )}
                          <div className="flex items-center justify-center mt-2 space-x-2">
                            <Switch
                              checked={leader.active}
                              onCheckedChange={() => toggleLeaderStatus(leader.id, leader.active)}
                            />
                            <span className={`text-xs ${leader.active ? 'text-green-600' : 'text-gray-400'}`}>
                              {leader.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOP 4 e 5 em lista */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📊 Posições 4º e 5º</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {listLeaders.map((leader) => (
                      <div
                        key={leader.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm font-semibold">
                            {leader.position}º
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{m.name(leader.name)}</h4>
                              <LeaderLevelBadge points={leader.points} size="sm" showIcon={true} />
                            </div>
                            <p className="text-xs text-muted-foreground">{m.city(leader.region)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <span className="font-bold text-primary-600">{m.number(leader.points, leader.name + '_pts')}</span>
                            <span className="text-xs text-muted-foreground ml-1">pts</span>
                            <span className="text-xs text-muted-foreground mx-1">•</span>
                            <span className="text-xs text-muted-foreground">{m.number(leader.indicacoes, leader.name + '_ind')} ind</span>
                          </div>
                          {leader.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsAppClick(leader.phone)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={leader.active}
                              onCheckedChange={() => toggleLeaderStatus(leader.id, leader.active)}
                            />
                            <Badge variant={leader.active ? "default" : "secondary"}>
                              {leader.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Novo: Ranking por RA */}
            <Card className="card-default" data-tutorial="ranking-ra">
              <CardHeader className="p-4 sm:p-6 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
                    Ranking por Região Administrativa
                  </CardTitle>
                  <FilterTabs selected={periodRA} onChange={setPeriodRA} />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <RankingChart
                  title=""
                  data={raChartData}
                />
              </CardContent>
            </Card>

            {/* Novo: Ranking por Temas */}
            <Card className="card-default" data-tutorial="ranking-temas">
              <CardHeader className="p-4 sm:p-6 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
                    Ranking por Temas/Pautas
                  </CardTitle>
                  <FilterTabs selected={periodTemas} onChange={setPeriodTemas} />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <RankingChart
                  title=""
                  data={temasChartData}
                />
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas Gerais */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="card-default" data-tutorial="stats-gerais">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Activity className="h-5 w-5 text-primary-600 mr-2" />
                  Estatísticas Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Total de Cadastros</span>
                  </div>
                  <span className="text-lg font-bold text-primary-600">
                    {m.number(dashboardStats?.totalRegistrations || 0, 'total_registrations').toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Cidades Alcançadas</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {m.number(dashboardStats?.citiesReached || 0, 'cities')} RAs
                  </span>
                </div>

                {dashboardStats?.topCity && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">RA com mais cadastros</span>
                    </div>
                    <span className="text-base font-semibold text-green-600">
                      {m.city(dashboardStats.topCity)} ({m.number(dashboardStats.topCityCount, 'top_city')})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Líderes Ativos</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    {m.number(dashboardStats?.activeLeaders || 0, 'active_leaders')}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Último cadastro</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatRelativeTime(m.date(dashboardStats?.lastRegistration || null))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Novo: Perfil dos Cadastrados */}
            {profileStats && (
              <div data-tutorial="perfil-stats">
                <ProfileStats data={profileStats} />
              </div>
            )}

            {/* Atendimento do Gabinete */}
            <Card className="card-default" data-tutorial="gabinete">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Building2 className="h-5 w-5 text-primary-600 mr-2" />
                  Atendimento do Gabinete
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {/* Cards de métricas */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{m.number(officeStats?.totalVisits || 0, 'office_total')}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded-lg">
                    <p className="text-xl font-bold text-amber-600">{m.number(officeStats?.pendingVisits || 0, 'office_pending')}</p>
                    <p className="text-xs text-muted-foreground">Aguardando</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{m.number(officeStats?.meetingsCompleted || 0, 'office_completed')}</p>
                    <p className="text-xs text-muted-foreground">Realizadas</p>
                  </div>
                </div>
                
                {/* Taxa de aceite */}
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Taxa de aceite de reunião</span>
                    <span className="font-bold text-purple-600">{m.percentage(officeStats?.acceptRateReuniao || 0, 'accept_rate')}%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${officeStats?.acceptRateReuniao || 0}%` }}
                    />
                  </div>
                </div>
                
                {/* Fila de atendimento */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <ClipboardList className="h-4 w-4 mr-1 text-muted-foreground" />
                    Próximos na fila
                  </h4>
                  {officeStats?.recentVisits && officeStats.recentVisits.length > 0 ? (
                    <div className="space-y-2">
                      {officeStats.recentVisits.slice(0, 3).map(visit => (
                        <div key={visit.id} className="flex justify-between items-center text-sm py-1 px-2 bg-muted/50 rounded">
                          <span className="truncate max-w-[120px]">{m.name(visit.contactName)}</span>
                          <Badge variant="outline" className="text-xs">
                            {visit.status === "LINK_SENT" && "Link Enviado"}
                            {visit.status === "FORM_SUBMITTED" && "Form Enviado"}
                            {visit.status === "CHECKED_IN" && "Check-in"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">Nenhuma visita na fila</p>
                  )}
                  <Button variant="link" asChild className="p-0 h-auto mt-2 text-primary-600">
                    <Link to="/office/queue">Ver fila completa →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-default" data-tutorial="acoes-rapidas">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/leaders">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Todos os Líderes
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Criar Novo Evento
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Relatório Detalhado
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;