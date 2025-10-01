import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Phone, 
  Search, 
  Filter, 
  Trophy, 
  Calendar,
  TrendingUp,
  Eye,
  ArrowUpDown
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data expandido para líderes
const mockLeadersData = [
  {
    id: 1,
    name: "Maria Silva Santos",
    phone: "61987654321",
    email: "maria.silva@email.com",
    registrations: 45,
    totalRegistrations: 127,
    position: 1,
    isActive: true,
    region: "Águas Claras",
    joinDate: "2023-01-15",
    lastActivity: "2024-01-15"
  },
  {
    id: 2,
    name: "João Pedro Oliveira",
    phone: "61912345678",
    email: "joao.pedro@email.com",
    registrations: 38,
    totalRegistrations: 98,
    position: 2,
    isActive: true,
    region: "Taguatinga",
    joinDate: "2023-02-20",
    lastActivity: "2024-01-14"
  },
  {
    id: 3,
    name: "Ana Carolina Ferreira",
    phone: "61998765432",
    email: "ana.carolina@email.com",
    registrations: 32,
    totalRegistrations: 89,
    position: 3,
    isActive: true,
    region: "Brasília",
    joinDate: "2023-01-10",
    lastActivity: "2024-01-15"
  },
  {
    id: 4,
    name: "Carlos Eduardo Lima",
    phone: "61987123456",
    email: "carlos.eduardo@email.com",
    registrations: 28,
    totalRegistrations: 156,
    position: 4,
    isActive: false,
    region: "Ceilândia",
    joinDate: "2022-11-05",
    lastActivity: "2024-01-10"
  },
  {
    id: 5,
    name: "Fernanda Costa Rocha",
    phone: "61912348765",
    email: "fernanda.costa@email.com",
    registrations: 25,
    totalRegistrations: 73,
    position: 5,
    isActive: true,
    region: "Samambaia",
    joinDate: "2023-03-12",
    lastActivity: "2024-01-14"
  },
  {
    id: 6,
    name: "Ricardo Mendes Silva",
    phone: "61987987987",
    email: "ricardo.mendes@email.com",
    registrations: 22,
    totalRegistrations: 65,
    position: 6,
    isActive: true,
    region: "Planaltina",
    joinDate: "2023-04-08",
    lastActivity: "2024-01-13"
  },
  {
    id: 7,
    name: "Patricia Santos Lima",
    phone: "61912912912",
    email: "patricia.santos@email.com",
    registrations: 19,
    totalRegistrations: 52,
    position: 7,
    isActive: true,
    region: "Gama",
    joinDate: "2023-05-22",
    lastActivity: "2024-01-12"
  },
  {
    id: 8,
    name: "Roberto Carlos Souza",
    phone: "61998998998",
    email: "roberto.carlos@email.com",
    registrations: 16,
    totalRegistrations: 41,
    position: 8,
    isActive: false,
    region: "Santa Maria",
    joinDate: "2023-06-15",
    lastActivity: "2024-01-08"
  }
];

const Leaders = () => {
  const [leaders, setLeaders] = useState(mockLeadersData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleWhatsAppClick = (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${normalizedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const toggleLeaderStatus = (leaderId: number) => {
    setLeaders(prev => 
      prev.map(leader => 
        leader.id === leaderId 
          ? { ...leader, isActive: !leader.isActive }
          : leader
      )
    );
  };

  // Filtros
  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch = leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leader.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === "all" || leader.region === selectedRegion;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && leader.isActive) ||
                         (statusFilter === "inactive" && !leader.isActive);
    
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const regions = [...new Set(leaders.map(leader => leader.region))];
  const activeLeaders = leaders.filter(leader => leader.isActive).length;

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Gestão de Lideranças
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {filteredLeaders.length} líderes • {activeLeaders} ativos
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
              <Button asChild>
                <Link to="/leaders/ranking">
                  <Trophy className="h-4 w-4 mr-2" />
                  Ver Ranking Completo
                </Link>
              </Button>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Adicionar Líder
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Filtros */}
          <div className="lg:col-span-1">
            <Card className="card-default">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Filter className="h-5 w-5 text-primary-600 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Buscar líder
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome ou e-mail..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Região Administrativa
                  </label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as regiões" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as regiões</SelectItem>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Líderes */}
          <div className="lg:col-span-3">
            <div className="space-y-3 sm:space-y-4">
              {filteredLeaders.map((leader) => (
                <Card key={leader.id} className="card-default">
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                      {/* Posição e Info Básica */}
                      <div className="md:col-span-5">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-lg font-bold">
                              {leader.position}º
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {leader.name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {leader.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {leader.region}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="md:col-span-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-primary-50 rounded-lg">
                            <p className="text-xs text-gray-600">Este mês</p>
                            <p className="font-bold text-primary-600">
                              {leader.registrations}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-gray-600">Total</p>
                            <p className="font-bold text-blue-600">
                              {leader.totalRegistrations}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status e Ações */}
                      <div className="md:col-span-4">
                        <div className="flex items-center justify-between space-x-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={leader.isActive}
                              onCheckedChange={() => toggleLeaderStatus(leader.id)}
                            />
                            <Badge variant={leader.isActive ? "default" : "secondary"}>
                              {leader.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsAppClick(leader.phone)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Última atividade: {new Date(leader.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredLeaders.length === 0 && (
                <Card className="card-default">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum líder encontrado
                    </h3>
                    <p className="text-gray-600">
                      Tente ajustar os filtros ou adicionar novos líderes.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaders;