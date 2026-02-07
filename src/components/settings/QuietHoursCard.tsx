import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Moon, Loader2 } from "lucide-react";
import { useIntegrationsSettings, useUpdateIntegrationsSettings } from "@/hooks/useIntegrationsSettings";

export function QuietHoursCard() {
  const { data: settings, isLoading } = useIntegrationsSettings();
  const updateSettings = useUpdateIntegrationsSettings();

  const [enabled, setEnabled] = useState(true);
  const [startTime, setStartTime] = useState("21:00");
  const [endTime, setEndTime] = useState("08:00");

  useEffect(() => {
    if (settings) {
      setEnabled((settings as any).quiet_hours_enabled ?? true);
      setStartTime((settings as any).quiet_hours_start || "21:00");
      setEndTime((settings as any).quiet_hours_end || "08:00");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      quiet_hours_enabled: enabled,
      quiet_hours_start: startTime,
      quiet_hours_end: endTime,
    } as any);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Moon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Horário de Silêncio</CardTitle>
              <CardDescription>
                Bloqueia disparos automáticos durante o período configurado (fuso: Brasília)
              </CardDescription>
            </div>
          </div>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="quiet-hours-toggle">Ativar horário de silêncio</Label>
          <Switch
            id="quiet-hours-toggle"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quiet-start">Início do silêncio</Label>
            <Input
              id="quiet-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!enabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiet-end">Fim do silêncio</Label>
            <Input
              id="quiet-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!enabled}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/50">
          <p>
            <strong className="text-foreground">Funções bloqueadas:</strong> Retentativas de SMS, fallback WhatsApp, mensagens agendadas, envios pendentes e reprocessamento de status.
          </p>
          <p className="mt-1">
            <strong className="text-foreground">Funções permitidas:</strong> Verificação, cadastro, inscrição em eventos e qualquer ação iniciada diretamente pelo usuário.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full"
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
