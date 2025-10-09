import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, BarChart3, Calendar, MessageSquare } from "lucide-react";
import logo from "@/assets/logo-rafael-prudente.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={logo} 
                alt="Rafael Prudente - Deputado Federal" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Rafael Prudente 360.ai
                </h1>
                <p className="text-gray-600">
                  Hub para conectar, compreender e mobilizar eleitores e lideranças
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="bg-primary-500 hover:bg-primary-600"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transforme a comunicação política
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Uma plataforma completa para captação, atribuição 360, eventos com QR, 
            ranking de lideranças, segmentação responsável e atendimento híbrido com IA.
          </p>
          <Button
            onClick={() => navigate("/login")}
            size="lg"
            className="bg-primary-500 hover:bg-primary-600 text-lg px-8 py-3"
          >
            Acessar Plataforma
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="card-default hover:shadow-hard transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle className="text-lg">Captação Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Campanhas com UTM, indicações por líderes e eventos presenciais 
                com QR codes personalizados.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-default hover:shadow-hard transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle className="text-lg">Ranking de Lideranças</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sistema de pontuação com pódio visual e métricas detalhadas 
                por período e região administrativa.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-default hover:shadow-hard transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle className="text-lg">Gestão de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Inscrições online, QR codes individuais, check-in automático 
                e relatórios por categoria e RA.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-default hover:shadow-hard transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle className="text-lg">Comunicação Híbrida</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                IA para classificação de intenções, atendimento humano 
                especializado e campanhas segmentadas.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-xl shadow-soft border border-border p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Pronto para começar?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Acesse a plataforma e descubra como transformar sua comunicação 
            política com ferramentas modernas e eficientes.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="bg-primary-500 hover:bg-primary-600"
            >
              Fazer Login
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/forgot-password")}
            >
              Esqueci minha senha
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={logo} 
                alt="Rafael Prudente - Deputado Federal" 
                className="h-8 w-auto"
              />
              <p className="text-gray-600">
                © 2025 Rafael Prudente - Deputado Federal
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Rafael Prudente 360.ai v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;