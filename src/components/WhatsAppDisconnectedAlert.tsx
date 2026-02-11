import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useIntegrationsSettings } from "@/hooks/useIntegrationsSettings";
import { useZapiConnectionStatus } from "@/hooks/useZapiConnectionStatus";

export function WhatsAppDisconnectedAlert() {
  const { data: settings } = useIntegrationsSettings();
  
  const isZapiConfigured = settings?.zapi_instance_id && 
                           settings?.zapi_token && 
                           settings?.zapi_enabled;

  const { data: status, isLoading } = useZapiConnectionStatus(
    settings?.zapi_instance_id || null,
    settings?.zapi_token || null,
    settings?.zapi_client_token || null,
    !!isZapiConfigured
  );

  // Não mostrar se não configurado, carregando ou conectado
  if (!isZapiConfigured || isLoading || status?.connected) {
    return null;
  }

  return (
    <Link
      to="/settings/integrations"
      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
                 text-destructive hover:opacity-80 transition-opacity mr-2 animate-fade-in"
      title="WhatsApp desconectado – clique para configurar"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
      </span>
      <span className="hidden sm:inline">WA</span>
    </Link>
  );
}
