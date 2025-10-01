import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Phone, 
  ArrowLeft,
  Calendar,
  TrendingUp,
  Award,
  Medal,
  Crown
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data para ranking histórico
const mockRankingData = {
  currentMonth: [
    { id: 1, name: "Maria Silva Santos", phone: "61987654321", points: 48, registrations: 45, events: 3, region: "Águas Claras", trend: "up" },
    { id: 2, name: "João Pedro Oliveira", phone: "61912345678", points: 41, registrations: 38, events: 3, region: "Taguatinga", trend: "up" },
    { id: 3, name: "Ana Carolina Ferreira", phone: "61998765432", points: 35, registrations: 32, events: 3, region: "Brasília", trend: "stable" },
    { id: 4, name: "Carlos Eduardo Lima", phone: "61987123456", points: 31, registrations: 28, events: 3, region: "Ceilândia", trend: "down" },
    { id: 5, name: "Fernanda Costa Rocha", phone: "61912348765", points: 28, registrations: 25, events: 3, region: "Samambaia", trend: "up" },
    { id: 6, name: "Ricardo Mendes Silva", phone: "61987987987", points: 25, registrations: 22, events: 3, region: "Planaltina", trend: "up" },
    { id: 7, name: "Patricia Santos Lima", phone: "61912912912", points: 22, registrations: 19, events: 3, region: "Gama", trend: "stable" },
    { id: 8, name: "Roberto Carlos Souza", phone: "61998998998", points: 19, registrations: 16, events: 3, region: "Santa Maria", trend: "down" },
    { id: 9, name: "Juliana Pereira", phone: "61987654987", points: 17, registrations: 14, events: 3, region: "Recanto das Emas", trend: "up" },
    { id: 10, name: "Anderson Silva", phone: "61912345987", points: 15, registrations: 12, events: 3, region: "São Sebastião", trend: "stable" }
  ]
};

const LeadersRanking = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const handleWhatsAppClick = (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${normalizedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const getTrophyIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-orange-600" />;
      default: return null;
    }
  };

  const getTrophyBg = (position: number) => {
    switch (position) {
      case 1: return "bg-yellow-50 border-yellow-200";
      case 2: return "bg-gray-50 border-gray-200";
      case 3: return "bg-orange-50 border-orange-200";
      default: return "bg-gray-50 border-gray-100";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down": return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600 bg-green-50";
      case "down": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const filteredRanking = mockRankingData.currentMonth.filter(leader => 
    selectedRegion === "all" || leader.region === selectedRegion
  );

  const regions = [...new Set(mockRankingData.currentMonth.map(leader => leader.region))];

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                <Button variant="ghost" asChild className="mr-2 w-fit">
                  <Link to="/leaders">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Link>
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Ranking Detalhado de Lideranças
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                Classificação completa com histórico de desempenho
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="card-default mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Período:
                </label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Mês Atual</SelectItem>
                    <SelectItem value="last">Mês Passado</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="year">Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Região:
                </label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Regiões</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:ml-auto w-full sm:w-auto">
                <Badge className="badge-brand w-full sm:w-auto justify-center">
                  {filteredRanking.length} líderes no ranking
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pódio TOP 3 */}
        <Card className="card-default mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Trophy className="h-5 w-5 text-primary-600 mr-2" />
              🏆 Pódio dos Campeões
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {filteredRanking.slice(0, 3).map((leader, index) => (
                <div
                  key={leader.id}
                  className={`relative p-6 rounded-xl border-2 ${getTrophyBg(index + 1)}`}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      {getTrophyIcon(index + 1)}
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}º
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {leader.name}
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary-600">
                          {leader.points}
                        </p>
                        <p className="text-sm text-gray-600">pontos</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center p-2 bg-white/50 rounded">
                          <p className="font-semibold">{leader.registrations}</p>
                          <p className="text-gray-600">cadastros</p>
                        </div>
                        <div className="text-center p-2 bg-white/50 rounded">
                          <p className="font-semibold">{leader.events}</p>
                          <p className="text-gray-600">eventos</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWhatsAppClick(leader.phone)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>

                      <div className="flex items-center justify-center space-x-1">
                        {getTrendIcon(leader.trend)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getTrendColor(leader.trend)}`}>
                          {leader.trend === "up" ? "Subindo" : 
                           leader.trend === "down" ? "Descendo" : "Estável"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ranking Completo */}
        <Card className="card-default">
          <CardHeader>
            <CardTitle>📊 Ranking Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRanking.map((leader, index) => (
                <div
                  key={leader.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3 ? getTrophyBg(index + 1) : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-lg font-bold">
                      {index + 1}º
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{leader.name}</h4>
                      <p className="text-sm text-gray-600">{leader.region}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="font-bold text-primary-600">{leader.points}</p>
                      <p className="text-xs text-gray-600">pontos</p>
                    </div>

                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{leader.registrations}</p>
                      <p className="text-xs text-gray-600">cadastros</p>
                    </div>

                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{leader.events}</p>
                      <p className="text-xs text-gray-600">eventos</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getTrendIcon(leader.trend)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWhatsAppClick(leader.phone)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema de Pontuação */}
        <Card className="card-default mt-6">
          <CardHeader>
            <CardTitle>ℹ️ Sistema de Pontuação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Como são calculados os pontos:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• +1 ponto por indicação válida</li>
                  <li>• +3 pontos por presença confirmada em evento</li>
                  <li>• Bônus de consistência mensal</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tendências:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Subindo: crescimento vs. mês anterior</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    <span className="text-gray-600">Descendo: queda vs. mês anterior</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-400 rounded-full" />
                    <span className="text-gray-600">Estável: mesmo patamar</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadersRanking;