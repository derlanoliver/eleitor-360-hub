import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Info, ArrowLeft } from "lucide-react";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/useAppSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrackingSettings = () => {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useAppSettings();
  const updateSettings = useUpdateAppSettings();

  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [facebookApiToken, setFacebookApiToken] = useState("");
  const [facebookPixelCode, setFacebookPixelCode] = useState("");
  const [gtmId, setGtmId] = useState("");

  useEffect(() => {
    if (settings) {
      setFacebookPixelId(settings.facebook_pixel_id || "");
      setFacebookApiToken(settings.facebook_api_token || "");
      setFacebookPixelCode(settings.facebook_pixel_code || "");
      setGtmId(settings.gtm_id || "");
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      facebook_pixel_id: facebookPixelId || null,
      facebook_api_token: facebookApiToken || null,
      facebook_pixel_code: facebookPixelCode || null,
      gtm_id: gtmId || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Rastreamento</h1>
          <p className="text-muted-foreground">
            Configure Facebook Pixel, Google Tag Manager e rastreamento de conversões
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Todas as configurações são aplicadas automaticamente em todas as páginas do sistema, 
          incluindo páginas públicas de cadastro. Eventos de Lead são disparados automaticamente 
          em inscrições de eventos, indicações e formulários.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Facebook Pixel Section */}
        <Card>
          <CardHeader>
            <CardTitle>Facebook Pixel</CardTitle>
            <CardDescription>
              Configure o rastreamento do Facebook para suas campanhas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
              <Input
                id="facebook_pixel_id"
                placeholder="1234567890"
                value={facebookPixelId}
                onChange={(e) => setFacebookPixelId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Encontre seu Pixel ID em: Meta Business Suite → Eventos → Pixels
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_api_token">Facebook API Token (Conversions API)</Label>
              <Input
                id="facebook_api_token"
                type="password"
                placeholder="Token de acesso para API de Conversões"
                value={facebookApiToken}
                onChange={(e) => setFacebookApiToken(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Opcional: Para rastreamento server-side mais preciso
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_pixel_code">Código Completo do Pixel (Opcional)</Label>
              <Textarea
                id="facebook_pixel_code"
                placeholder="<!-- Facebook Pixel Code -->&#10;<script>&#10;  !function(f,b,e,v,n,t,s)...&#10;</script>&#10;<!-- End Facebook Pixel Code -->"
                value={facebookPixelCode}
                onChange={(e) => setFacebookPixelCode(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Opcional: Cole o código JavaScript completo do Pixel para configuração avançada. 
                Se preenchido, será usado no lugar do Pixel ID acima.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Google Tag Manager Section */}
        <Card>
          <CardHeader>
            <CardTitle>Google Tag Manager</CardTitle>
            <CardDescription>
              Configure o GTM para gerenciar todas as suas tags de marketing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gtm_id">GTM Container ID</Label>
              <Input
                id="gtm_id"
                placeholder="GTM-XXXXXX"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Encontre seu GTM ID em: Google Tag Manager → Admin → Container ID
              </p>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full"
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Salvar Configurações
        </Button>
      </form>
    </div>
  );
};

export default TrackingSettings;
