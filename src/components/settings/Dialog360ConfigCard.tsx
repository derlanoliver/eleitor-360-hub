import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MessageSquare, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Info, Plus, X, Copy, Check } from "lucide-react";
import { useUpdateIntegrationsSettings, useTest360DialogConnection } from "@/hooks/useIntegrationsSettings";
import { toast } from "sonner";

interface Dialog360ConfigCardProps {
  settings: {
    dialog360_enabled?: boolean;
    dialog360_api_key?: string | null;
    dialog360_phone_number_id?: string | null;
    dialog360_test_mode?: boolean;
    dialog360_whitelist?: string[];
    dialog360_fallback_enabled?: boolean;
    zapi_enabled?: boolean;
  } | null;
}

const WEBHOOK_URL = "https://eydqducvsddckhyatcux.supabase.co/functions/v1/dialog360-webhook";
const VERIFY_TOKEN = "LOVABLE_360DIALOG_WEBHOOK_2024";

export const Dialog360ConfigCard = ({ settings }: Dialog360ConfigCardProps) => {
  const updateSettings = useUpdateIntegrationsSettings();
  const testConnection = useTest360DialogConnection();

  const [enabled, setEnabled] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelistNumber, setNewWhitelistNumber] = useState("");
  const [fallbackEnabled, setFallbackEnabled] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.dialog360_enabled || false);
      setPhoneNumberId(settings.dialog360_phone_number_id || "");
      setTestMode(settings.dialog360_test_mode ?? true);
      setWhitelist(settings.dialog360_whitelist || []);
      setFallbackEnabled(settings.dialog360_fallback_enabled || false);
    }
  }, [settings]);

  const handleAddWhitelist = () => {
    if (newWhitelistNumber.trim()) {
      let number = newWhitelistNumber.replace(/\D/g, "");
      if (!number.startsWith("55") && number.length <= 11) {
        number = "55" + number;
      }
      if (!whitelist.includes(number)) {
        setWhitelist([...whitelist, number]);
      }
      setNewWhitelistNumber("");
    }
  };

  const handleRemoveWhitelist = (number: string) => {
    setWhitelist(whitelist.filter(n => n !== number));
  };

  const handleSave = () => {
    updateSettings.mutate({
      dialog360_enabled: enabled,
      dialog360_phone_number_id: phoneNumberId || null,
      dialog360_test_mode: testMode,
      dialog360_whitelist: whitelist,
      dialog360_fallback_enabled: fallbackEnabled,
    });
  };

  const handleTestConnection = () => {
    if (!phoneNumberId) return;
    testConnection.mutate(phoneNumberId);
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setWebhookCopied(true);
      toast.success("URL do webhook copiada!");
      setTimeout(() => setWebhookCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(VERIFY_TOKEN);
      setTokenCopied(true);
      toast.success("Verify Token copiado!");
      setTimeout(() => setTokenCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const isConfigured = !!phoneNumberId;

  return (
    <Card className="border-2 border-teal-200 bg-teal-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                360dialog
                <Badge variant="outline" className="text-teal-600 border-teal-300 text-xs">
                  WhatsApp BSP
                </Badge>
              </CardTitle>
              <CardDescription>
                WhatsApp Business API via 360dialog
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConfigured ? (
              enabled ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary">Configurado</Badge>
              )
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
                Não configurado
              </Badge>
            )}
            <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!isConfigured} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Config Fields */}
        <div className="space-y-2">
          <Label htmlFor="d360-phone-number-id">Phone Number ID *</Label>
          <Input
            id="d360-phone-number-id"
            placeholder="Ex: 123456789012345"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Encontre no painel da 360dialog → Números → Detalhes
          </p>
        </div>

        {/* API Key Warning */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Importante:</strong> A API Key da 360dialog está configurada como secret no ambiente
            (<code className="bg-amber-100 px-1 rounded">DIALOG360_API_KEY</code>).
            Para alterar, acesse as configurações de secrets do projeto.
          </AlertDescription>
        </Alert>

        {/* Webhook Config */}
        <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border/50">
          <Label className="font-medium">Configuração do Webhook</Label>
          <p className="text-sm text-muted-foreground">
            Configure na 360dialog para receber mensagens e status de entrega.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">Callback URL</Label>
            <div className="flex gap-2">
              <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs bg-muted" />
              <Button variant="outline" size="icon" onClick={handleCopyWebhook} className="shrink-0">
                {webhookCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Verify Token</Label>
            <div className="flex gap-2">
              <Input value={VERIFY_TOKEN} readOnly className="font-mono text-xs bg-muted" />
              <Button variant="outline" size="icon" onClick={handleCopyToken} className="shrink-0">
                {tokenCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Test Mode */}
        <div className="space-y-4 bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-teal-600" />
              <Label className="font-medium">Modo Teste</Label>
            </div>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>
          
          {testMode && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No modo teste, apenas números na whitelist receberão mensagens via 360dialog.
              </p>
              <div className="space-y-2">
                <Label className="text-sm">Whitelist (números E.164)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 5561999999999"
                    value={newWhitelistNumber}
                    onChange={(e) => setNewWhitelistNumber(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddWhitelist()}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddWhitelist}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {whitelist.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {whitelist.map((number) => (
                      <Badge key={number} variant="secondary" className="flex items-center gap-1">
                        +{number}
                        <button onClick={() => handleRemoveWhitelist(number)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fallback */}
        <div className="flex items-center justify-between py-3 border-t border-border/50">
          <div>
            <Label className="font-medium">Fallback para Z-API</Label>
            <p className="text-xs text-muted-foreground">
              Se a 360dialog falhar, tentar envio via Z-API
            </p>
          </div>
          <Switch checked={fallbackEnabled} onCheckedChange={setFallbackEnabled} disabled={!settings?.zapi_enabled} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4">
          <Button variant="outline" onClick={handleTestConnection} disabled={!isConfigured || testConnection.isPending}>
            {testConnection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Testar Conexão
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
