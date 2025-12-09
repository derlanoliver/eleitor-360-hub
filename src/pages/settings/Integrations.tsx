import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Mail, Link2, Eye, EyeOff, CheckCircle2, XCircle, Copy, Check, Smartphone } from "lucide-react";
import { useIntegrationsSettings, useUpdateIntegrationsSettings, useTestZapiConnection, useTestSmsdevConnection } from "@/hooks/useIntegrationsSettings";
import { useTestResendConnection } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";

const WEBHOOK_URL = "https://eydqducvsddckhyatcux.supabase.co/functions/v1/greatpages-webhook";

const GreatPagesWebhookCard = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar URL");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">GreatPages - Captura de Leads</CardTitle>
              <CardDescription>
                Receba leads automaticamente das suas landing pages GreatPages
              </CardDescription>
            </div>
          </div>
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL do Webhook */}
        <div className="space-y-2">
          <Label>URL do Webhook</Label>
          <div className="flex gap-2">
            <Input 
              value={WEBHOOK_URL} 
              readOnly 
              className="font-mono text-xs sm:text-sm bg-muted"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Instruções de configuração */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Como configurar na GreatPages:</h4>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
            <li>Acesse sua página no GreatPages</li>
            <li>Vá em <strong className="text-foreground">Configurações → Integrações → Webhook</strong></li>
            <li>Cole a URL acima no campo de webhook</li>
            <li>Selecione método <strong className="text-foreground">POST</strong></li>
            <li>Salve as configurações</li>
          </ol>
        </div>

        {/* Campos aceitos */}
        <div className="space-y-2">
          <Label className="text-sm">Campos aceitos</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-mono text-xs">nome / name</Badge>
            <Badge variant="secondary" className="font-mono text-xs">email</Badge>
            <Badge variant="secondary" className="font-mono text-xs">telefone / phone / whatsapp</Badge>
            <Badge variant="secondary" className="font-mono text-xs">cidade / city</Badge>
            <Badge variant="secondary" className="font-mono text-xs">utm_source</Badge>
            <Badge variant="secondary" className="font-mono text-xs">utm_medium</Badge>
            <Badge variant="secondary" className="font-mono text-xs">utm_campaign</Badge>
          </div>
        </div>

        {/* Comportamento */}
        <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/50">
          <p>
            <strong className="text-foreground">Comportamento:</strong> O webhook verifica automaticamente se o lead já é uma liderança cadastrada. 
            Se for, atualiza apenas dados faltantes. Se não for, cria um novo contato com origem "Webhook" 
            e dispara mensagens de boas-vindas automaticamente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const Integrations = () => {
  const { data: settings, isLoading } = useIntegrationsSettings();
  const updateSettings = useUpdateIntegrationsSettings();
  const testZapiConnection = useTestZapiConnection();
  const testResendConnection = useTestResendConnection();
  const testSmsdevConnection = useTestSmsdevConnection();

  // Z-API state
  const [zapiInstanceId, setZapiInstanceId] = useState("");
  const [zapiToken, setZapiToken] = useState("");
  const [zapiClientToken, setZapiClientToken] = useState("");
  const [zapiEnabled, setZapiEnabled] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showClientToken, setShowClientToken] = useState(false);

  // Resend state
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendFromEmail, setResendFromEmail] = useState("");
  const [resendFromName, setResendFromName] = useState("");
  const [resendEnabled, setResendEnabled] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);

  // SMSDEV state
  const [smsdevApiKey, setSmsdevApiKey] = useState("");
  const [smsdevEnabled, setSmsdevEnabled] = useState(false);
  const [showSmsdevKey, setShowSmsdevKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setZapiInstanceId(settings.zapi_instance_id || "");
      setZapiToken(settings.zapi_token || "");
      setZapiClientToken(settings.zapi_client_token || "");
      setZapiEnabled(settings.zapi_enabled || false);
      setResendApiKey(settings.resend_api_key || "");
      setResendFromEmail(settings.resend_from_email || "");
      setResendFromName(settings.resend_from_name || "");
      setResendEnabled(settings.resend_enabled || false);
      setSmsdevApiKey(settings.smsdev_api_key || "");
      setSmsdevEnabled(settings.smsdev_enabled || false);
    }
  }, [settings]);

  const handleSaveZapi = () => {
    updateSettings.mutate({
      zapi_instance_id: zapiInstanceId || null,
      zapi_token: zapiToken || null,
      zapi_client_token: zapiClientToken || null,
      zapi_enabled: zapiEnabled,
    });
  };

  const handleSaveResend = () => {
    updateSettings.mutate({
      resend_api_key: resendApiKey || null,
      resend_from_email: resendFromEmail || null,
      resend_from_name: resendFromName || null,
      resend_enabled: resendEnabled,
    });
  };

  const handleSaveSmsdev = () => {
    updateSettings.mutate({
      smsdev_api_key: smsdevApiKey || null,
      smsdev_enabled: smsdevEnabled,
    });
  };

  const handleTestZapi = () => {
    if (!zapiInstanceId || !zapiToken) return;
    testZapiConnection.mutate({
      instanceId: zapiInstanceId,
      token: zapiToken,
      clientToken: zapiClientToken || undefined,
    });
  };

  const handleTestResend = () => {
    if (!resendApiKey) return;
    testResendConnection.mutate(resendApiKey);
  };

  const handleTestSmsdev = () => {
    if (!smsdevApiKey) return;
    testSmsdevConnection.mutate(smsdevApiKey);
  };

  const isZapiConfigured = zapiInstanceId && zapiToken;
  const isResendConfigured = resendApiKey && resendFromEmail;
  const isSmsdevConfigured = !!smsdevApiKey;

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
                {isZapiConfigured ? (
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
                  disabled={!isZapiConfigured}
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
                onClick={handleTestZapi}
                disabled={!isZapiConfigured || testZapiConnection.isPending}
              >
                {testZapiConnection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Testar Conexão
              </Button>
              <Button
                onClick={handleSaveZapi}
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

        {/* Resend Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Resend - Email Marketing</CardTitle>
                  <CardDescription>
                    Envie emails automatizados e em massa
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isResendConfigured ? (
                  resendEnabled ? (
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
                  checked={resendEnabled}
                  onCheckedChange={setResendEnabled}
                  disabled={!isResendConfigured}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="resend-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="resend-key"
                    type={showResendKey ? "text" : "password"}
                    placeholder="re_xxxxxxxxxx"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowResendKey(!showResendKey)}
                  >
                    {showResendKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha em <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">resend.com/api-keys</a>
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="resend-email">Email Remetente</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="naoresponda@seudominio.com"
                    value={resendFromEmail}
                    onChange={(e) => setResendFromEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Domínio deve estar verificado no Resend
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resend-name">Nome do Remetente</Label>
                  <Input
                    id="resend-name"
                    placeholder="Ex: Gabinete Rafael Prudente"
                    value={resendFromName}
                    onChange={(e) => setResendFromName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleTestResend}
                disabled={!resendApiKey || testResendConnection.isPending}
              >
                {testResendConnection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Testar Conexão
              </Button>
              <Button
                onClick={handleSaveResend}
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

        {/* SMSDEV SMS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">SMSDEV - Envio de SMS</CardTitle>
                  <CardDescription>
                    Envie SMS automatizados e em massa
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isSmsdevConfigured ? (
                  smsdevEnabled ? (
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
                  checked={smsdevEnabled}
                  onCheckedChange={setSmsdevEnabled}
                  disabled={!isSmsdevConfigured}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smsdev-key">API Key</Label>
              <div className="relative">
                <Input
                  id="smsdev-key"
                  type={showSmsdevKey ? "text" : "password"}
                  placeholder="Sua chave de API do SMSDEV"
                  value={smsdevApiKey}
                  onChange={(e) => setSmsdevApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowSmsdevKey(!showSmsdevKey)}
                >
                  {showSmsdevKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtenha em <a href="https://www.smsdev.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">smsdev.com.br</a>
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleTestSmsdev}
                disabled={!smsdevApiKey || testSmsdevConnection.isPending}
              >
                {testSmsdevConnection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Testar Conexão
              </Button>
              <Button
                onClick={handleSaveSmsdev}
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

        {/* GreatPages Webhook */}
        <GreatPagesWebhookCard />
      </div>
    </DashboardLayout>
  );
};

export default Integrations;
