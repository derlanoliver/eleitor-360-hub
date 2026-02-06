import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, ChevronDown, MessageSquare, CheckCircle2, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { useIntegrationsSettings, useUpdateIntegrationsSettings } from "@/hooks/useIntegrationsSettings";
import { useZapiConnectionStatus } from "@/hooks/useZapiConnectionStatus";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function VerificationSettingsCard() {
  const { data: settings, isLoading } = useIntegrationsSettings();
  const updateSettings = useUpdateIntegrationsSettings();
  
  // Check Z-API connection status
  const { data: zapiStatus, isLoading: isCheckingZapi } = useZapiConnectionStatus(
    settings?.zapi_instance_id ?? null,
    settings?.zapi_token ?? null,
    settings?.zapi_client_token ?? null,
    settings?.zapi_enabled ?? false
  );
  
  const [verificationMethod, setVerificationMethod] = useState<'link' | 'whatsapp_consent'>('link');
  const [verificationWaEnabled, setVerificationWaEnabled] = useState(false);
  const [verificationWaTestMode, setVerificationWaTestMode] = useState(true);
  const [verificationWaWhitelist, setVerificationWaWhitelist] = useState("");
  const [verificationWaKeyword, setVerificationWaKeyword] = useState("CONFIRMAR");
  const [verificationWaZapiPhone, setVerificationWaZapiPhone] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  const isFallbackActive = settings?.verification_fallback_active ?? false;
  const isZapiConnected = zapiStatus?.connected ?? false;

  useEffect(() => {
    if (settings) {
      setVerificationMethod((settings.verification_method as 'link' | 'whatsapp_consent') || 'link');
      setVerificationWaEnabled(settings.verification_wa_enabled || false);
      setVerificationWaTestMode(settings.verification_wa_test_mode ?? true);
      setVerificationWaWhitelist((settings.verification_wa_whitelist || []).join('\n'));
      setVerificationWaKeyword(settings.verification_wa_keyword || 'CONFIRMAR');
      setVerificationWaZapiPhone(settings.verification_wa_zapi_phone || '');
    }
  }, [settings]);

  const handleSave = () => {
    const whitelist = verificationWaWhitelist
      .split('\n')
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);

    updateSettings.mutate({
      verification_method: verificationMethod,
      verification_wa_enabled: verificationWaEnabled,
      verification_wa_test_mode: verificationWaTestMode,
      verification_wa_whitelist: whitelist,
      verification_wa_keyword: verificationWaKeyword,
      verification_wa_zapi_phone: verificationWaZapiPhone || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isWhatsAppMethod = verificationMethod === 'whatsapp_consent';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Verificação de Cadastro</CardTitle>
              <CardDescription>
                Configure como novos apoiadores confirmam o cadastro
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Fallback indicator */}
            {isFallbackActive && verificationWaEnabled && isWhatsAppMethod ? (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Fallback SMS Ativo
              </Badge>
            ) : verificationWaEnabled && isWhatsAppMethod ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <MessageSquare className="h-3 w-3 mr-1" />
                WhatsApp Ativo
              </Badge>
            ) : (
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Link SMS
              </Badge>
            )}
            
            {/* Z-API connection status */}
            {settings?.zapi_enabled && (
              <div className="flex items-center gap-1.5 text-xs">
                {isCheckingZapi ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : isZapiConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fallback Alert */}
        {isFallbackActive && verificationWaEnabled && isWhatsAppMethod && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Fallback SMS ativo:</strong> O WhatsApp está desconectado
              {settings?.zapi_disconnected_at && (
                <span className="text-amber-600">
                  {" "}(há {formatDistanceToNow(new Date(settings.zapi_disconnected_at), { locale: ptBR })})
                </span>
              )}. As verificações estão sendo enviadas automaticamente via SMS até a reconexão.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Toggle Master */}
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium">Verificação via WhatsApp</p>
            <p className="text-sm text-muted-foreground">
              Permite confirmar cadastro respondendo "SIM" no WhatsApp
            </p>
          </div>
          <Switch 
            checked={verificationWaEnabled}
            onCheckedChange={setVerificationWaEnabled}
          />
        </div>
        
        {verificationWaEnabled && (
          <>
            {/* Método de Verificação */}
            <div className="space-y-3">
              <Label>Método de Verificação Ativo</Label>
              <RadioGroup 
                value={verificationMethod} 
                onValueChange={(v) => setVerificationMethod(v as 'link' | 'whatsapp_consent')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="link" id="link" />
                  <Label htmlFor="link" className="font-normal cursor-pointer">
                    Link via SMS (atual) - Enviar link de verificação por SMS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp_consent" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="font-normal cursor-pointer">
                    WhatsApp com Consentimento - Usuário envia mensagem e confirma com "SIM"
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {isWhatsAppMethod && (
              <>
                {/* Modo Teste */}
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="font-medium">Modo Teste</p>
                    <p className="text-sm text-muted-foreground">
                      Apenas admins e telefones na whitelist podem usar verificação WhatsApp
                    </p>
                  </div>
                  <Switch 
                    checked={verificationWaTestMode}
                    onCheckedChange={setVerificationWaTestMode}
                  />
                </div>
                
                {/* Whitelist (se modo teste) */}
                {verificationWaTestMode && (
                  <div className="space-y-2">
                    <Label>Telefones para Teste (Whitelist)</Label>
                    <Textarea
                      placeholder={"+5561999999999\n+5511988887777\n(um telefone por linha)"}
                      value={verificationWaWhitelist}
                      onChange={(e) => setVerificationWaWhitelist(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Telefones que podem usar a verificação WhatsApp no modo teste
                    </p>
                  </div>
                )}

                {/* Número do Z-API */}
                <div className="space-y-2">
                  <Label>Número do WhatsApp (Z-API)</Label>
                  <Input
                    placeholder="5561999999999"
                    value={verificationWaZapiPhone}
                    onChange={(e) => setVerificationWaZapiPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este número será usado no link wa.me para o usuário enviar a mensagem
                  </p>
                </div>

                {/* Configurações Avançadas */}
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                    Configurações Avançadas
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Palavra-chave</Label>
                      <Input
                        placeholder="CONFIRMAR"
                        value={verificationWaKeyword}
                        onChange={(e) => setVerificationWaKeyword(e.target.value.toUpperCase())}
                      />
                      <p className="text-xs text-muted-foreground">
                        Palavra que o usuário deve enviar seguida do código (ex: CONFIRMAR ABC123)
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Instruções */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border/50">
                  <h4 className="font-medium text-sm">Como funciona:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                    <li>Usuário se cadastra e vê botão "Verificar pelo WhatsApp"</li>
                    <li>Ao clicar, abre WhatsApp com mensagem pré-preenchida: <code className="bg-muted px-1 rounded">{verificationWaKeyword} ABC123</code></li>
                    <li>Sistema recebe a mensagem e pergunta: "Você autoriza? Responda SIM"</li>
                    <li>Usuário responde "SIM" e cadastro é verificado automaticamente</li>
                  </ol>
                </div>
              </>
            )}
          </>
        )}

        <div className="flex gap-3 pt-4">
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
  );
}
