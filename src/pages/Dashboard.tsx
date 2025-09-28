import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trophy, Phone, Users, MapPin, Calendar, Activity } from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Visão geral do desempenho e ranking de lideranças
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Ranking de Lideranças - Pódio + TOP 5 */}
          <div className="lg:col-span-2">
            <Card className="card-default">
              <CardHeader>
                <CardTitle className="flex items-center text-base md:text-lg">
                  <Trophy className="h-5 w-5 text-primary-600 mr-2" />
                  Ranking de Lideranças - TOP 5
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pódio TOP 3 */}
                <div className="mb-6 md:mb-8">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">🏆 Pódio do Mês</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                              <span className="text-xs hidden sm:inline">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Posições 4º e 5º</h3>
                  <div className="space-y-3">
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
          </div>

          {/* Estatísticas Gerais */}
          <div className="space-y-6">
            <Card className="card-default">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 text-primary-600 mr-2" />
                  Estatísticas Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Total de Cadastros</span>
                  </div>
                  <span className="text-lg font-bold text-primary-600">
                    {mockStats.totalRegistrations.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Cidades Alcançadas</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {mockStats.citiesReached} RAs
                  </span>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <MapPin className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">RA com mais cadastros</span>
                  </div>
                  <span className="text-base font-semibold text-green-600">
                    {mockStats.topCity}
                  </span>
                </div>

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

            {/* Quick Actions */}
            <Card className="card-default">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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