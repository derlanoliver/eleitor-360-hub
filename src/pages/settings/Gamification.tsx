import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy, Target, Info, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGamificationSettings, GamificationSettings } from "@/hooks/leaders/useLeaderLevels";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LevelConfig {
  name: string;
  icon: string;
  min: number;
  max: number | null;
  colorClass: string;
}

export default function Gamification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGamificationSettings();
  
  const [limiteEventosDia, setLimiteEventosDia] = useState(0);
  const [pontosFormSubmitted, setPontosFormSubmitted] = useState(1);
  const [pontosAceitaReuniao, setPontosAceitaReuniao] = useState(3);
  const [levels, setLevels] = useState<LevelConfig[]>([
    { name: 'Bronze', icon: '🥉', min: 0, max: 10, colorClass: 'bg-amber-100 border-amber-300' },
    { name: 'Prata', icon: '🥈', min: 11, max: 30, colorClass: 'bg-gray-100 border-gray-300' },
    { name: 'Ouro', icon: '🥇', min: 31, max: 50, colorClass: 'bg-yellow-100 border-yellow-400' },
    { name: 'Diamante', icon: '💎', min: 51, max: null, colorClass: 'bg-blue-100 border-blue-400' },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLimiteEventosDia(settings.limite_eventos_dia ?? 0);
      setPontosFormSubmitted(settings.pontos_form_submitted ?? 1);
      setPontosAceitaReuniao(settings.pontos_aceita_reuniao ?? 3);
      setLevels([
        { name: 'Bronze', icon: '🥉', min: settings.nivel_bronze_min ?? 0, max: settings.nivel_bronze_max ?? 10, colorClass: 'bg-amber-100 border-amber-300' },
        { name: 'Prata', icon: '🥈', min: settings.nivel_prata_min ?? 11, max: settings.nivel_prata_max ?? 30, colorClass: 'bg-gray-100 border-gray-300' },
        { name: 'Ouro', icon: '🥇', min: settings.nivel_ouro_min ?? 31, max: settings.nivel_ouro_max ?? 50, colorClass: 'bg-yellow-100 border-yellow-400' },
        { name: 'Diamante', icon: '💎', min: settings.nivel_diamante_min ?? 51, max: null, colorClass: 'bg-blue-100 border-blue-400' },
      ]);
    }
  }, [settings]);

  const handleLevelChange = (index: number, field: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    const newLevels = [...levels];
    
    if (field === 'max') {
      newLevels[index].max = numValue;
      // Auto-ajustar min do próximo nível
      if (index < newLevels.length - 1) {
        newLevels[index + 1].min = numValue + 1;
      }
    } else if (field === 'min' && index > 0) {
      newLevels[index].min = numValue;
      // Auto-ajustar max do nível anterior
      newLevels[index - 1].max = numValue - 1;
    }
    
    setLevels(newLevels);
  };

  const validateLevels = (): boolean => {
    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i].max === null || levels[i].max! < levels[i].min) {
        toast.error(`${levels[i].name}: máximo deve ser maior ou igual ao mínimo`);
        return false;
      }
      if (levels[i].max! >= levels[i + 1].min) {
        toast.error(`Ranges dos níveis ${levels[i].name} e ${levels[i + 1].name} estão sobrepostos`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateLevels()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("office_settings")
        .update({
          limite_eventos_dia: limiteEventosDia,
          pontos_form_submitted: pontosFormSubmitted,
          pontos_aceita_reuniao: pontosAceitaReuniao,
          nivel_bronze_min: levels[0].min,
          nivel_bronze_max: levels[0].max,
          nivel_prata_min: levels[1].min,
          nivel_prata_max: levels[1].max,
          nivel_ouro_min: levels[2].min,
          nivel_ouro_max: levels[2].max,
          nivel_diamante_min: levels[3].min,
        })
        .eq("id", (await supabase.from("office_settings").select("id").single()).data?.id);

      if (error) throw error;

      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ["leader_levels"] });
      queryClient.invalidateQueries({ queryKey: ["gamification_settings"] });
      queryClient.invalidateQueries({ queryKey: ["office_settings"] });
      
      toast.success("Configurações de gamificação salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
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
          <h1 className="text-2xl font-bold">Gamificação</h1>
          <p className="text-muted-foreground">Configure as regras de pontuação e níveis de líderes</p>
        </div>
      </div>

      {/* Limite diário de eventos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Limite Diário de Eventos</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Define quantos eventos por dia podem gerar pontos para um líder. Use 0 para ilimitado.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Limita a pontuação de líderes que participam de múltiplos eventos no mesmo dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="limite">Máximo de eventos por dia</Label>
              <Input
                id="limite"
                type="number"
                min={0}
                value={limiteEventosDia}
                onChange={(e) => setLimiteEventosDia(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div className="text-sm text-muted-foreground pt-6">
              {limiteEventosDia === 0 ? "Ilimitado" : `Máximo ${limiteEventosDia} evento(s)/dia`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pontos por ação */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Pontos por Ação</CardTitle>
          </div>
          <CardDescription>
            Configure quantos pontos cada ação gera para os líderes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pontosForm">Pontos por formulário preenchido</Label>
              <Input
                id="pontosForm"
                type="number"
                min={0}
                value={pontosFormSubmitted}
                onChange={(e) => setPontosFormSubmitted(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pontosReuniao">Pontos por aceitar reunião</Label>
              <Input
                id="pontosReuniao"
                type="number"
                min={0}
                value={pontosAceitaReuniao}
                onChange={(e) => setPontosAceitaReuniao(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Níveis de liderança */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Níveis de Liderança</CardTitle>
          </div>
          <CardDescription>
            Configure os ranges de pontuação para cada nível. Os níveis são atualizados dinamicamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {levels.map((level, index) => (
              <div
                key={level.name}
                className={`p-4 rounded-lg border-2 ${level.colorClass}`}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="text-2xl">{level.icon}</span>
                    <span className="font-semibold">{level.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap">De:</Label>
                    <Input
                      type="number"
                      min={0}
                      value={level.min}
                      onChange={(e) => handleLevelChange(index, 'min', e.target.value)}
                      className="w-20"
                      disabled={index === 0}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap">Até:</Label>
                    {level.max === null ? (
                      <div className="w-20 h-10 flex items-center justify-center text-muted-foreground border rounded-md bg-muted">
                        ∞
                      </div>
                    ) : (
                      <Input
                        type="number"
                        min={level.min}
                        value={level.max}
                        onChange={(e) => handleLevelChange(index, 'max', e.target.value)}
                        className="w-20"
                      />
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {level.max === null 
                      ? `${level.min}+ pontos`
                      : `${level.min} - ${level.max} pontos`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview visual */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Preview dos Níveis</h4>
            <div className="flex items-center gap-1 h-8">
              {levels.map((level, index) => {
                const prevMax = index > 0 ? (levels[index - 1].max ?? 0) : -1;
                const width = level.max === null 
                  ? 20 
                  : Math.min(30, Math.max(10, ((level.max - level.min + 1) / 10) * 10));
                
                return (
                  <div
                    key={level.name}
                    className={`h-full flex items-center justify-center text-xs font-medium border rounded ${level.colorClass}`}
                    style={{ width: `${width}%` }}
                    title={`${level.name}: ${level.min} - ${level.max ?? '∞'}`}
                  >
                    {level.icon}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 pts</span>
              <span>→</span>
              <span>∞</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
