import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Mail, Link2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { useIntegrationsSettings, useUpdateIntegrationsSettings, useTestZapiConnection } from "@/hooks/useIntegrationsSettings";

const Integrations = () => {
  const { data: settings, isLoading } = useIntegrationsSettings();
  const updateSettings = useUpdateIntegrationsSettings();
  const testConnection = useTestZapiConnection();

  const [zapiInstanceId, setZapiInstanceId] = useState("");
  const [zapiToken, setZapiToken] = useState("");
  const [zapiClientToken, setZapiClientToken] = useState("");
  const [zapiEnabled, setZapiEnabled] = useState(false);
  
  const [showToken, setShowToken] = useState(false);
  const [showClientToken, setShowClientToken] = useState(false);

  useEffect(() => {
    if (settings) {
      setZapiInstanceId(settings.zapi_instance_id || "");
      setZapiToken(settings.zapi_token || "");
      setZapiClientToken(settings.zapi_client_token || "");
      setZapiEnabled(settings.zapi_enabled || false);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      zapi_instance_id: zapiInstanceId || null,
      zapi_token: zapiToken || null,
      zapi_client_token: zapiClientToken || null,
      zapi_enabled: zapiEnabled,
    });
  };

  const handleTestConnection = () => {
    if (!zapiInstanceId || !zapiToken) {
      return;
    }
    testConnection.mutate({
      instanceId: zapiInstanceId,
      token: zapiToken,
      clientToken: zapiClientToken || undefined,
    });
  };

  const isConfigured = zapiInstanceId && zapiToken;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Conecte serviços externos para ampliar as funcionalidades do sistema
          </p>
        </div>

        {/* Z-API WhatsApp */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Z-API WhatsApp</CardTitle>
                  <CardDescription>
                    Envie mensagens automáticas via WhatsApp
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isConfigured ? (
                  zapiEnabled ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Configurado
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <XCircle className="h-3 w-3 mr-1" />
                    Não configurado
                  </Badge>
                )}
                <Switch
                  checked={zapiEnabled}
                  onCheckedChange={setZapiEnabled}
                  disabled={!isConfigured}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="zapi-instance">Instance ID</Label>
                <Input
                  id="zapi-instance"
                  placeholder="Ex: 3C9ABCDEF123456789"
                  value={zapiInstanceId}
                  onChange={(e) => setZapiInstanceId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre o Instance ID no painel do Z-API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zapi-token">Token</Label>
                <div className="relative">
                  <Input
                    id="zapi-token"
                    type={showToken ? "text" : "password"}
                    placeholder="Token de autenticação da instância"
                    value={zapiToken}
                    onChange={(e) => setZapiToken(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zapi-client-token">Client Token (opcional)</Label>
                <div className="relative">
                  <Input
                    id="zapi-client-token"
                    type={showClientToken ? "text" : "password"}
                    placeholder="Token de segurança da conta"
                    value={zapiClientToken}
                    onChange={(e) => setZapiClientToken(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowClientToken(!showClientToken)}
                  >
                    {showClientToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recomendado para maior segurança
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={!isConfigured || testConnection.isPending}
              >
                {testConnection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Testar Conexão
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Marketing - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Email Marketing</CardTitle>
                  <CardDescription>
                    Conecte com Mailchimp, SendGrid ou outros provedores
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Em breve
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Webhooks - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Webhooks Personalizados</CardTitle>
                  <CardDescription>
                    Configure endpoints para receber dados em tempo real
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Em breve
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Integrations;
