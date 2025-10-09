import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Filter, Trophy, Eye, Phone, Loader2, MapPin, Calendar, Copy, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeaders } from "@/services/office/officeService";
import { useOfficeCities } from "@/hooks/office/useOfficeCities";
import { AddLeaderDialog } from "@/components/leaders/AddLeaderDialog";
import { toast } from "sonner";
import type { OfficeLeader } from "@/types/office";

const Leaders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: cities } = useOfficeCities();
  const { data: leaders, isLoading } = useQuery({
    queryKey: ["leaders", selectedRegion === "all" ? undefined : selectedRegion, searchTerm],
    queryFn: () => getLeaders({
      cidade_id: selectedRegion === "all" ? undefined : selectedRegion,
      search: searchTerm || undefined
    })
  });

  const handleWhatsAppClick = (phone: string) => {
    const normalizedPhone = phone?.replace(/\D/g, '');
    if (normalizedPhone) {
      const whatsappUrl = `https://wa.me/${normalizedPhone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCopyAffiliateLink = (leader: OfficeLeader) => {
    if (!leader.affiliate_token) {
      toast.error("Token de afiliado não disponível");
      return;
    }
    const link = `${window.location.origin}/affiliate/${leader.affiliate_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(leader.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Link de indicação copiado!");
  };

  // Filtros
  const filteredLeaders = (leaders || []).filter(leader => {
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && leader.is_active) ||
                         (statusFilter === "inactive" && !leader.is_active);
    
    return matchesStatus;
  });

  const activeLeaders = leaders?.filter(leader => leader.is_active).length || 0;

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
                {isLoading ? "Carregando..." : `${filteredLeaders.length} líderes • ${activeLeaders} ativos`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
              <Button asChild>
                <Link to="/leaders/ranking">
                  <Trophy className="h-4 w-4 mr-2" />
                  Ver Ranking Completo
                </Link>
              </Button>
              <AddLeaderDialog>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Adicionar Líder
                </Button>
              </AddLeaderDialog>
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
                      placeholder="Nome..."
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
                      {cities?.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.nome}
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
              {isLoading ? (
                <Card className="card-default">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando líderes...</p>
                  </CardContent>
                </Card>
              ) : filteredLeaders.length === 0 ? (
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
              ) : (
                filteredLeaders.map((leader) => (
                  <Card key={leader.id} className="card-default">
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                        {/* Info Básica */}
                        <div className="md:col-span-5">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-lg">
                                <Users className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {leader.nome_completo}
                              </h3>
                              {leader.email && (
                                <p className="text-sm text-gray-600 truncate">
                                  {leader.email}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {leader.cidade?.nome || "Sem região"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="md:col-span-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 bg-primary-50 rounded-lg">
                              <p className="text-xs text-gray-600">Cadastros</p>
                              <p className="font-bold text-primary-600">
                                {leader.cadastros}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs text-gray-600">Pontos</p>
                              <p className="font-bold text-blue-600">
                                {leader.pontuacao_total}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status e Ações */}
                        <div className="md:col-span-4">
                          <div className="flex items-center justify-between space-x-3">
                            <Badge variant={leader.is_active ? "default" : "secondary"}>
                              {leader.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyAffiliateLink(leader)}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                title="Copiar link de indicação"
                              >
                                {copiedId === leader.id ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              {leader.telefone && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWhatsAppClick(leader.telefone!)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {leader.last_activity && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(leader.last_activity).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaders;
