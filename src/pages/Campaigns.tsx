import { useState } from "react";
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
import { 
  Target, 
  Plus, 
  ExternalLink, 
  Copy, 
  QrCode,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  Edit,
  Share,
  Download
} from "lucide-react";

// Mock data para campanhas
const mockCampaignsData = [
  {
    id: 1,
    name: "Campanha Facebook Janeiro 2024",
    description: "Divulgação de propostas para educação via Facebook",
    utmSource: "facebook",
    utmMedium: "social",
    utmCampaign: "educacao_jan24",
    link: "https://plataforma360.com/cadastro?utm_source=facebook&utm_medium=social&utm_campaign=educacao_jan24",
    qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+PHRleHQgeD0iMTAwIiB5PSIxMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iYmxhY2siPkVkdWNhw6fDo28gSmFuMjQ8L3RleHQ+PC9zdmc+",
    createdAt: "2024-01-10",
    status: "active",
    registrations: 45,
    conversions: 12
  },
  {
    id: 2,
    name: "Instagram Stories - Saúde",
    description: "Stories sobre melhorias na saúde pública do DF",
    utmSource: "instagram",
    utmMedium: "stories",
    utmCampaign: "saude_stories",
    link: "https://plataforma360.com/cadastro?utm_source=instagram&utm_medium=stories&utm_campaign=saude_stories",
    qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+PHRleHQgeD0iMTAwIiB5PSIxMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iYmxhY2siPlNhw7pkZSBTdG9yaWVzPC90ZXh0Pjwvc3ZnPg==",
    createdAt: "2024-01-08",
    status: "active",
    registrations: 28,
    conversions: 8
  },
  {
    id: 3,
    name: "WhatsApp Business - Mobilidade",
    description: "Divulgação via WhatsApp Business sobre transporte público",
    utmSource: "whatsapp",
    utmMedium: "business",
    utmCampaign: "mobilidade_whats",
    link: "https://plataforma360.com/cadastro?utm_source=whatsapp&utm_medium=business&utm_campaign=mobilidade_whats",
    qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+PHRleHQgeD0iMTAwIiB5PSIxMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iYmxhY2siPk1vYmlsaWRhZGU8L3RleHQ+PC9zdmc+",
    createdAt: "2024-01-05",
    status: "paused",
    registrations: 15,
    conversions: 4
  }
];

// Mock data para links de líderes
const mockLeaderLinksData = [
  {
    id: 1,
    leaderName: "Maria Silva Santos",
    leaderPhone: "61987654321",
    personalCode: "MSS2024",
    link: "https://plataforma360.com/indicacao/MSS2024",
    qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+PHRleHQgeD0iMTAwIiB5PSIxMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iYmxhY2siPk1TUzIwMjQ8L3RleHQ+PC9zdmc+",
    createdAt: "2024-01-15",
    registrations: 45,
    lastUsed: "2024-01-14"
  },
  {
    id: 2,
    leaderName: "João Pedro Oliveira",
    leaderPhone: "61912345678",
    personalCode: "JPO2024",
    link: "https://plataforma360.com/indicacao/JPO2024",
    qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+PHRleHQgeD0iMTAwIiB5PSIxMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iYmxhY2siPkpQTzIwMjQ8L3RleHQ+PC9zdmc+",
    createdAt: "2024-01-12",
    registrations: 38,
    lastUsed: "2024-01-13"
  }
];

// Mock data para relatório de origens
const mockAttributionData = [
  { source: "Líder: Maria Santos", registrations: 45, percentage: 32, growth: "+15%" },
  { source: "Campanha Facebook", registrations: 28, percentage: 20, growth: "+8%" },
  { source: "Líder: João Oliveira", registrations: 25, percentage: 18, growth: "+5%" },
  { source: "Instagram Stories", registrations: 20, percentage: 14, growth: "+12%" },
  { source: "WhatsApp Business", registrations: 15, percentage: 11, growth: "-2%" },
  { source: "Evento Presencial", registrations: 7, percentage: 5, growth: "+3%" }
];

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState(mockCampaignsData);
  const [leaderLinks] = useState(mockLeaderLinksData);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: ""
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.utmSource || !newCampaign.utmCampaign) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o nome, fonte e campanha UTM.",
        variant: "destructive"
      });
      return;
    }

    const campaignId = campaigns.length + 1;
    const link = `https://plataforma360.com/cadastro?utm_source=${newCampaign.utmSource}&utm_medium=${newCampaign.utmMedium || 'direct'}&utm_campaign=${newCampaign.utmCampaign}`;
    
    const campaign = {
      id: campaignId,
      ...newCampaign,
      link,
      qrCode: `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="black">${newCampaign.utmCampaign}</text></svg>`)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: "active" as const,
      registrations: 0,
      conversions: 0
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ name: "", description: "", utmSource: "", utmMedium: "", utmCampaign: "" });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Campanha criada!",
      description: "Link e QR Code gerados com sucesso."
    });
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

  const toggleCampaignStatus = (campaignId: number) => {
    setCampaigns(campaigns.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: campaign.status === "active" ? "paused" : "active" }
        : campaign
    ));
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Campanhas & Atribuição
              </h1>
              <p className="text-gray-600">
                Geração de links, QR Codes e relatórios de origem dos cadastros
              </p>
            </div>
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
                />
              </DialogContent>
            </Dialog>
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
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Cadastros</p>
                            <p className="font-bold text-blue-600">{campaign.registrations}</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Conversões</p>
                            <p className="font-bold text-green-600">{campaign.conversions}</p>
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
                            <Button variant="ghost" size="sm">
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
              {leaderLinks.map((leader) => (
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
                            <p className="text-sm text-gray-600">
                              Código: {leader.personalCode}
                            </p>
                            <p className="text-xs text-gray-500">
                              {leader.leaderPhone}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="md:col-span-3">
                        <div className="text-center p-3 bg-primary-50 rounded-lg">
                          <p className="text-sm text-gray-600">Indicações</p>
                          <p className="font-bold text-primary-600">{leader.registrations}</p>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Último uso: {new Date(leader.lastUsed).toLocaleDateString()}
                        </p>
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
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQRCode(leader.qrCode, leader.personalCode)}
                              className="flex-1"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              QR Code
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const whatsappText = `Olá! Use este link para se cadastrar na Plataforma 360 Eleitor/DF: ${leader.link}`;
                                const whatsappUrl = `https://wa.me/55${leader.leaderPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              className="flex-1"
                            >
                              <Share className="h-4 w-4 mr-2" />
                              Compartilhar
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

          {/* Relatório de Origens */}
          <TabsContent value="attribution">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Resumo Geral */}
              <div className="lg:col-span-1">
                <Card className="card-default">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
                      Resumo Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total de Cadastros</p>
                      <p className="text-2xl font-bold text-primary-600">140</p>
                      <p className="text-xs text-green-600 flex items-center justify-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +18% este mês
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Líderes</p>
                        <p className="font-bold text-blue-600">70</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Campanhas</p>
                        <p className="font-bold text-green-600">63</p>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-gray-600">Eventos</p>
                      <p className="font-bold text-orange-600">7</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Origens */}
              <div className="lg:col-span-2">
                <Card className="card-default">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Target className="h-5 w-5 text-primary-600 mr-2" />
                        Origens dos Cadastros
                      </span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockAttributionData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{item.source}</h4>
                              <p className="text-sm text-gray-600">{item.percentage}% do total</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{item.registrations}</p>
                            <p className={`text-sm ${item.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {item.growth}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Componente para criar nova campanha
const CreateCampaignForm = ({ 
  newCampaign, 
  setNewCampaign, 
  onSubmit 
}: {
  newCampaign: any;
  setNewCampaign: (campaign: any) => void;
  onSubmit: () => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome da Campanha *</Label>
          <Input
            id="name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            placeholder="Ex: Facebook Janeiro 2024"
          />
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
        <Button variant="outline" onClick={() => setNewCampaign({ name: "", description: "", utmSource: "", utmMedium: "", utmCampaign: "" })}>
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