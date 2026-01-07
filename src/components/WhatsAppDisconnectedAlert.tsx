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
      className="flex items-center gap-1.5 px-2.5 py-1.5 
                 bg-red-50 border border-red-200 rounded-md 
                 text-red-600 text-xs font-medium 
                 hover:bg-red-100 transition-colors mr-3
                 animate-fade-in"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">WhatsApp Desconectado</span>
      <span className="sm:hidden">WhatsApp</span>
    </Link>
  );
}
