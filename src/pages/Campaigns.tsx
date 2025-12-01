import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { generateCampaignUrl, generateLeaderReferralUrl, generateEventCampaignUrl } from "@/lib/urlHelper";
import { useEvents } from "@/hooks/events/useEvents";
import { useAttributionStats } from "@/hooks/campaigns/useAttributionStats";
import { format } from "date-fns";
import CampaignReportDialog from "@/components/campaigns/CampaignReportDialog";
import LeaderReferralsDialog from "@/components/campaigns/LeaderReferralsDialog";
import { 
  Target, 
  Plus, 
  ExternalLink, 
  Copy, 
  QrCode,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  Edit,
  Share,
  Download,
  RefreshCw,
  MapPin,
  UserCheck,
  Megaphone,
  FileSpreadsheet,
  Building2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const Campaigns = () => {
  const [newCampaign, setNewCampaign] = useState({
    eventId: "",
    eventSlug: "",
    name: "",
    description: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: ""
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{ utmCampaign: string; name: string } | null>(null);
  const [referralsDialogOpen, setReferralsDialogOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<{
    id: string;
    leaderName: string;
    cityName: string | null;
  } | null>(null);
  const { toast } = useToast();
  
  const { data: events = [] } = useEvents();
  const activeEvents = events.filter(e => e.status === 'active');

  // Buscar campanhas reais do banco
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Para cada campanha, buscar visitantes (page_views)
      const campaignsWithMetrics = await Promise.all((data || []).map(async (campaign: any) => {
        // Buscar page_views com tratamento de erro
        const { count: pageViewsCount, error: pageViewsError } = await supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .eq('utm_campaign', campaign.utm_campaign);

        if (pageViewsError) {
          console.error('Erro ao buscar page_views:', pageViewsError);
        }

        const pageViews = pageViewsCount || 0;
        const registrations = campaign.total_cadastros;
        const conversionRate = pageViews > 0 ? ((registrations / pageViews) * 100).toFixed(1) : "0.0";

        return {
          id: campaign.id,
          name: campaign.nome,
          description: campaign.descricao || '',
          utmSource: campaign.utm_source,
          utmMedium: campaign.utm_medium || '',
          utmCampaign: campaign.utm_campaign,
          eventSlug: campaign.event_slug,
          link: campaign.event_slug 
            ? generateEventCampaignUrl(
                campaign.event_slug,
                campaign.utm_source,
                campaign.utm_medium || 'direct',
                campaign.utm_campaign
              )
            : generateCampaignUrl(
                campaign.utm_source,
                campaign.utm_medium || 'direct',
                campaign.utm_campaign
              ),
          qrCode: `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="black">${campaign.utm_campaign}</text></svg>`)}`,
          createdAt: new Date(campaign.created_at).toISOString().split('T')[0],
          status: campaign.status,
          registrations,
          pageViews,
          conversionRate
        };
      }));

      return campaignsWithMetrics;
    },
    refetchOnWindowFocus: true,  // Atualiza ao voltar para a aba
    staleTime: 30000, // Considera dados stale após 30 segundos
  });

  // Buscar líderes reais do banco
  const { data: leaderLinks = [] } = useQuery({
    queryKey: ['leaders-with-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lideres')
        .select('id, nome_completo, telefone, affiliate_token, cidade:office_cities(nome), cadastros, last_activity')
        .eq('is_active', true)
        .not('affiliate_token', 'is', null)
        .order('cadastros', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(leader => ({
        id: leader.id,
        leaderName: leader.nome_completo,
        leaderPhone: leader.telefone || '',
        affiliateToken: leader.affiliate_token!,
        cityName: leader.cidade && typeof leader.cidade === 'object' && 'nome' in leader.cidade 
          ? (leader.cidade as { nome: string }).nome 
          : null,
        link: generateLeaderReferralUrl(leader.affiliate_token!),
        registrations: leader.cadastros,
        lastActivity: leader.last_activity
      }));
    },
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const handleCreateCampaign = async () => {
    if (!newCampaign.eventId || !newCampaign.utmSource || !newCampaign.utmCampaign) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o evento, fonte e campanha UTM.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          event_id: newCampaign.eventId,
          event_slug: newCampaign.eventSlug,
          nome: newCampaign.name,
          descricao: newCampaign.description,
          utm_source: newCampaign.utmSource,
          utm_medium: newCampaign.utmMedium || null,
          utm_campaign: newCampaign.utmCampaign,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Campanha criada!",
        description: "A campanha foi criada com sucesso."
      });

      setNewCampaign({ eventId: "", eventSlug: "", name: "", description: "", utmSource: "", utmMedium: "", utmCampaign: "" });
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a campanha.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência."
    });
  };

  const downloadQRCode = (qrCode: string, filename: string) => {
    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = qrCode;
    link.click();
    
    toast({
      title: "QR Code baixado!",
      description: "Arquivo salvo como SVG."
    });
  };

  const toggleCampaignStatus = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const newStatus = campaign.status === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      refetch(); // Recarregar campanhas
      toast({
        title: "Status atualizado!",
        description: `Campanha ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Campanhas & Atribuição
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Geração de links, QR Codes e relatórios de origem dos cadastros
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Nova Campanha</DialogTitle>
                </DialogHeader>
                <CreateCampaignForm 
                  newCampaign={newCampaign}
                  setNewCampaign={setNewCampaign}
                  onSubmit={handleCreateCampaign}
                  activeEvents={activeEvents}
                />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">Campanhas UTM</TabsTrigger>
            <TabsTrigger value="leaders">Links de Líderes</TabsTrigger>
            <TabsTrigger value="attribution">Relatório de Origens</TabsTrigger>
          </TabsList>

          {/* Campanhas UTM */}
          <TabsContent value="campaigns">
            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="card-default">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-12 gap-4">
                      {/* Info da Campanha */}
                      <div className="md:col-span-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {campaign.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {campaign.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                                {campaign.status === "active" ? "Ativa" : "Pausada"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {campaign.utmSource}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCampaignStatus(campaign.id)}
                          >
                            {campaign.status === "active" ? "Pausar" : "Ativar"}
                          </Button>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="md:col-span-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">Visitantes</p>
                            <p className="font-bold text-purple-600">{campaign.pageViews}</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Cadastros</p>
                            <p className="font-bold text-blue-600">{campaign.registrations}</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Conversão</p>
                            <p className="font-bold text-green-600">{campaign.conversionRate}%</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Criada em {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Link e QR Code */}
                      <div className="md:col-span-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={campaign.link}
                              readOnly
                              className="text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(campaign.link)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(campaign.link, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQRCode(campaign.qrCode, campaign.utmCampaign)}
                              className="flex-1"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              Baixar QR
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedCampaign({ 
                                  utmCampaign: campaign.utmCampaign, 
                                  name: campaign.name 
                                });
                                setReportDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Links de Líderes */}
          <TabsContent value="leaders">
            <div className="grid gap-6">
              {leaderLinks.length === 0 ? (
                <Card className="card-default">
                  <CardContent className="p-6 text-center text-gray-500">
                    Nenhum líder com token de afiliado encontrado.
                  </CardContent>
                </Card>
              ) : (
                leaderLinks.map((leader) => (
                  <Card key={leader.id} className="card-default">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-12 gap-4 items-center">
                        {/* Info do Líder */}
                        <div className="md:col-span-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                              {leader.leaderName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {leader.leaderName}
                              </h3>
                              {leader.cityName && (
                                <p className="text-sm text-gray-600">
                                  {leader.cityName}
                                </p>
                              )}
                              {leader.leaderPhone && (
                                <p className="text-xs text-gray-500">
                                  {leader.leaderPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="md:col-span-3">
                          <button
                            onClick={() => {
                              setSelectedLeader({
                                id: leader.id,
                                leaderName: leader.leaderName,
                                cityName: leader.cityName,
                              });
                              setReferralsDialogOpen(true);
                            }}
                            className="w-full text-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors cursor-pointer"
                          >
                            <p className="text-sm text-gray-600">Indicações</p>
                            <p className="font-bold text-primary-600">{leader.registrations}</p>
                          </button>
                          {leader.lastActivity && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                              Última atividade: {new Date(leader.lastActivity).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Link e Ações */}
                        <div className="md:col-span-5">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Input
                                value={leader.link}
                                readOnly
                                className="text-xs"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(leader.link)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(leader.link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {leader.leaderPhone && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const whatsappText = `Olá! Use este link para se cadastrar: ${leader.link}`;
                                    const whatsappUrl = `https://wa.me/55${leader.leaderPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`;
                                    window.open(whatsappUrl, '_blank');
                                  }}
                                  className="flex-1"
                                >
                                  <Share className="h-4 w-4 mr-2" />
                                  Compartilhar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Relatório de Origens */}
          <TabsContent value="attribution">
            <AttributionReport />
          </TabsContent>
        </Tabs>

        {/* Modal de Relatório */}
        {selectedCampaign && (
          <CampaignReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            campaignUtmCampaign={selectedCampaign.utmCampaign}
            campaignName={selectedCampaign.name}
          />
        )}

        {/* Modal de Indicações do Líder */}
        <LeaderReferralsDialog
          open={referralsDialogOpen}
          onOpenChange={setReferralsDialogOpen}
          leader={selectedLeader}
        />
      </div>
    </div>
  );
};

// Componente para o relatório de atribuição com dados reais
const AttributionReport = () => {
  const { data: stats, isLoading, refetch } = useAttributionStats();
  
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  
  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'leader': return <UserCheck className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'campaign': return <Megaphone className="h-4 w-4" />;
      case 'manual': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        Não foi possível carregar os dados de atribuição.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral - Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="card-default">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-primary-600">{stats.summary.totalContacts.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Contatos</p>
            {stats.growthPercentage !== 0 && (
              <p className={`text-xs flex items-center justify-center mt-1 ${stats.growthPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.growthPercentage > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {stats.growthPercentage > 0 ? '+' : ''}{stats.growthPercentage}% este mês
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="card-default">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.summary.fromLeaders}</p>
            <p className="text-xs text-muted-foreground">Via Líderes</p>
          </CardContent>
        </Card>

        <Card className="card-default">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.summary.totalEventRegistrations}</p>
            <p className="text-xs text-muted-foreground">Eventos</p>
          </CardContent>
        </Card>

        <Card className="card-default">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.summary.totalOfficeVisits}</p>
            <p className="text-xs text-muted-foreground">Visitas</p>
          </CardContent>
        </Card>

        <Card className="card-default">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.summary.activeLeaders}</p>
            <p className="text-xs text-muted-foreground">Líderes Ativos</p>
          </CardContent>
        </Card>

        <Card className="card-default">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Megaphone className="h-5 w-5 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-pink-600">{stats.summary.activeCampaigns}</p>
            <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card className="card-default">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
              Evolução de Cadastros (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Cadastros"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Fonte */}
        <Card className="card-default">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Target className="h-5 w-5 text-primary-600 mr-2" />
              Distribuição por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.sourceBreakdown.length > 0 ? (
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.sourceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="source"
                    >
                      {stats.sourceBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {stats.sourceBreakdown.map((item, index) => (
                    <div key={item.source} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.source}</span>
                      </div>
                      <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma fonte de atribuição identificada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Líderes */}
        <Card className="card-default">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <UserCheck className="h-5 w-5 text-primary-600 mr-2" />
              Top Líderes por Indicações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topLeaders.length > 0 ? (
              <div className="space-y-3">
                {stats.topLeaders.map((leader, index) => (
                  <div key={leader.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{leader.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {leader.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {leader.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{leader.totalCadastros}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {leader.contactsFromLink > 0 && (
                          <Badge variant="outline" className="text-xs py-0">
                            {leader.contactsFromLink} links
                          </Badge>
                        )}
                        {leader.eventRegistrations > 0 && (
                          <Badge variant="outline" className="text-xs py-0">
                            {leader.eventRegistrations} eventos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum líder com indicações registradas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Cidades */}
        <Card className="card-default">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <MapPin className="h-5 w-5 text-primary-600 mr-2" />
              Distribuição por Cidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.cityDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.cityDistribution.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      dataKey="city" 
                      type="category" 
                      width={100} 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Contatos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhum dado de cidade disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada de origens */}
      <Card className="card-default">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-base">
              <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
              Detalhamento por Origem
            </span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.sourceBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.sourceBreakdown.map((item, index) => (
                <div key={item.source} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                      {getSourceIcon(item.sourceType)}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.source}</h4>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{item.count.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{item.percentage}% do total</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma origem identificada.</p>
              <p className="text-sm mt-2">
                Os cadastros serão categorizados quando houver líderes, campanhas ou eventos ativos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para criar nova campanha
const CreateCampaignForm = ({ 
  newCampaign, 
  setNewCampaign, 
  onSubmit,
  activeEvents
}: {
  newCampaign: any;
  setNewCampaign: (campaign: any) => void;
  onSubmit: () => void;
  activeEvents: any[];
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event">Evento *</Label>
          <Select 
            value={newCampaign.eventId} 
            onValueChange={(eventId) => {
              const event = activeEvents.find(e => e.id === eventId);
              setNewCampaign({ 
                ...newCampaign, 
                eventId,
                eventSlug: event?.slug || '',
                name: event?.name || ''
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {activeEvents.length === 0 ? (
                <SelectItem value="empty" disabled>Nenhum evento ativo disponível</SelectItem>
              ) : (
                activeEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {format(new Date(event.date), 'dd/MM/yyyy')}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="utmSource">UTM Source *</Label>
          <Select 
            value={newCampaign.utmSource} 
            onValueChange={(value) => setNewCampaign({ ...newCampaign, utmSource: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="utmMedium">UTM Medium</Label>
          <Select 
            value={newCampaign.utmMedium} 
            onValueChange={(value) => setNewCampaign({ ...newCampaign, utmMedium: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o meio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="stories">Stories</SelectItem>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="ad">Anúncio</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="print">Material Impresso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="utmCampaign">UTM Campaign *</Label>
          <Input
            id="utmCampaign"
            value={newCampaign.utmCampaign}
            onChange={(e) => setNewCampaign({ ...newCampaign, utmCampaign: e.target.value })}
            placeholder="Ex: educacao_jan24"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={newCampaign.description}
          onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
          placeholder="Descreva o objetivo desta campanha..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={() => setNewCampaign({ eventId: "", eventSlug: "", name: "", description: "", utmSource: "", utmMedium: "", utmCampaign: "" })}>
          Limpar
        </Button>
        <Button onClick={onSubmit}>
          Criar Campanha
        </Button>
      </div>
    </div>
  );
};

export default Campaigns;