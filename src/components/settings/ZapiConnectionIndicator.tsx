import { Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZapiConnectionIndicatorProps {
  isConnected: boolean;
  isLoading: boolean;
  isConfigured: boolean;
}

export function ZapiConnectionIndicator({ 
  isConnected, 
  isLoading, 
  isConfigured 
}: ZapiConnectionIndicatorProps) {
  if (!isConfigured) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-sm font-medium",
      isConnected ? "text-green-600" : "text-red-500"
    )}>
      <Circle className={cn(
        "h-3 w-3 fill-current",
        isConnected ? "text-green-500" : "text-red-500"
      )} />
      <span>{isConnected ? "Conectado" : "Desconectado"}</span>
    </div>
  );
}
