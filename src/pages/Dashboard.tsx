import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trophy, Phone, Users, MapPin, Calendar, Activity, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { RankingChart } from "@/components/dashboard/RankingChart";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { ProfileStats } from "@/components/dashboard/ProfileStats";
import rankingTemas from "@/data/dashboard/ranking_temas.json";
import perfilData from "@/data/dashboard/perfil.json";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Mock data para o ranking de lideranças
const mockLeaders = [
  {
    id: 1,
    name: "Maria Silva Santos",
    phone: "61987654321",
    registrations: 45,
    position: 1,
    isActive: true,
  },
  {
    id: 2,
    name: "João Pedro Oliveira",
    phone: "61912345678",
    registrations: 38,
    position: 2,
    isActive: true,
  },
  {
    id: 3,
    name: "Ana Carolina Ferreira",
    phone: "61998765432",
    registrations: 32,
    position: 3,
    isActive: true,
  },
  {
    id: 4,
    name: "Carlos Eduardo Lima",
    phone: "61987123456",
    registrations: 28,
    position: 4,
    isActive: false,
  },
  {
    id: 5,
    name: "Fernanda Costa Rocha",
    phone: "61912348765",
    registrations: 25,
    position: 5,
    isActive: true,
  },
];

// Mock data para estatísticas gerais
const mockStats = {
  totalRegistrations: 2847,
  citiesReached: 18,
  topCity: "Águas Claras",
  activeLeaders: 23,
  lastRegistration: "Há 2 minutos",
};

const Dashboard = () => {
  const [periodRA, setPeriodRA] = useState("30d");
  const [periodTemas, setPeriodTemas] = useState("30d");

  // Buscar ranking de RAs em tempo real do banco
  const { data: rankingRA = [] } = useQuery({
    queryKey: ['ranking_ra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_contacts')
        .select('cidade_id, cidade:office_cities(nome, codigo_ra)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Agrupar por cidade e contar
      const grouped = data.reduce((acc, contact) => {
        const cidade = contact.cidade?.nome || 'Desconhecido';
        acc[cidade] = (acc[cidade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Formatar para o mesmo formato esperado
      return Object.entries(grouped)
        .map(([ra, cadastros]) => ({ ra, cadastros }))
        .sort((a, b) => b.cadastros - a.cadastros);
    }
  });

  const handleWhatsAppClick = (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${normalizedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const toggleLeaderStatus = (leaderId: number) => {
    console.log(`Toggling status for leader ${leaderId}`);
    // Mock action - in real app, would update via API
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

  const podiumLeaders = mockLeaders.slice(0, 3);
  const listLeaders = mockLeaders.slice(3, 5);

  // Preparar dados dos gráficos
  const raChartData = rankingRA?.slice(0, 8).map(item => ({
    name: item.ra,
    value: item.cadastros
  })) || [];

  const temasChartData = rankingTemas.slice(0, 8).map(item => ({
    name: item.tema,
    value: item.cadastros
  }));

  // Calcular total de cadastros a partir dos dados
  const totalCadastros = rankingRA?.reduce((sum, item) => sum + item.cadastros, 0) || 0;

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Visão geral do desempenho e ranking de lideranças
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Ranking de Lideranças - Pódio + TOP 5 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="card-default">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Trophy className="h-5 w-5 text-primary-600 mr-2" />
                  Ranking de Lideranças - TOP 5
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
                          <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${getTrophyBg(leader.position)}`}>
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
                            {leader.name}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsAppClick(leader.phone)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-auto"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            <span className="text-xs">
                              ({leader.phone.slice(0,2)}) {leader.phone.slice(2,7)}-{leader.phone.slice(7)}
                            </span>
                          </Button>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {leader.registrations} cadastros
                            </span>
                          </div>
                          <div className="flex items-center justify-center mt-2 space-x-2">
                            <span className="text-xs text-gray-600">Status:</span>
                            <Switch
                              checked={leader.isActive}
                              onCheckedChange={() => toggleLeaderStatus(leader.id)}
                            />
                            <span className={`text-xs ${leader.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                              {leader.isActive ? 'Ativo' : 'Inativo'}
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
                            <h4 className="font-medium text-gray-900">{leader.name}</h4>
                            <p className="text-sm text-gray-600">{leader.registrations} cadastros este mês</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsAppClick(leader.phone)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              ({leader.phone.slice(0,2)}) {leader.phone.slice(2,7)}-{leader.phone.slice(7)}
                            </span>
                          </Button>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={leader.isActive}
                              onCheckedChange={() => toggleLeaderStatus(leader.id)}
                            />
                            <Badge variant={leader.isActive ? "default" : "secondary"}>
                              {leader.isActive ? 'Ativo' : 'Inativo'}
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
            <Card className="card-default">
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
            <Card className="card-default">
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
            <Card className="card-default">
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
                    {totalCadastros.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Cidades Alcançadas</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {rankingRA?.length || 0} RAs
                  </span>
                </div>

                {rankingRA && rankingRA.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">RA com mais cadastros</span>
                    </div>
                    <span className="text-base font-semibold text-green-600">
                      {rankingRA[0].ra}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Líderes Ativos</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    {mockStats.activeLeaders}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Último cadastro</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {mockStats.lastRegistration}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Novo: Perfil dos Cadastrados */}
            <ProfileStats data={perfilData} />

            {/* Quick Actions */}
            <Card className="card-default">
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