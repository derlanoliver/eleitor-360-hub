import { Link } from "react-router-dom";
import { useIntegrationsSettings } from "@/hooks/useIntegrationsSettings";
import { useZapiConnectionStatus } from "@/hooks/useZapiConnectionStatus";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function StatusDot({ connected, label }: { connected: boolean; label: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/settings/integrations"
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
                       hover:opacity-80 transition-opacity"
          >
            <span className="relative flex h-2 w-2">
              {!connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-green-500' : 'bg-destructive'}`} />
            </span>
            <span className={`hidden sm:inline ${connected ? 'text-green-600' : 'text-destructive'}`}>
              {label}
            </span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label} – {connected ? "Conectado" : "Desconectado"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WhatsAppDisconnectedAlert() {
  const { data: settings } = useIntegrationsSettings();
  
  // Z-API status
  const isZapiConfigured = settings?.zapi_instance_id && 
                           settings?.zapi_token && 
                           settings?.zapi_enabled;

  const { data: zapiStatus, isLoading: zapiLoading } = useZapiConnectionStatus(
    settings?.zapi_instance_id || null,
    settings?.zapi_token || null,
    settings?.zapi_client_token || null,
    !!isZapiConfigured
  );

  // Meta Cloud API status
  const isMetaConfigured = settings?.meta_cloud_enabled && settings?.meta_cloud_phone_number_id;
  const [metaConnected, setMetaConnected] = useState<boolean | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    if (!isMetaConfigured || !settings?.meta_cloud_phone_number_id) {
      setMetaConnected(null);
      return;
    }

    const checkMeta = async () => {
      setMetaLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('test-meta-cloud-connection', {
          body: { 
            phoneNumberId: settings.meta_cloud_phone_number_id,
            apiVersion: settings.meta_cloud_api_version || 'v21.0'
          }
        });
        setMetaConnected(!error && data?.success);
      } catch {
        setMetaConnected(false);
      } finally {
        setMetaLoading(false);
      }
    };

    checkMeta();
  }, [isMetaConfigured, settings?.meta_cloud_phone_number_id]);

  const showZapi = !!isZapiConfigured && !zapiLoading;
  const showMeta = !!isMetaConfigured && !metaLoading && metaConnected !== null;

  if (!showZapi && !showMeta) return null;

  return (
    <div className="flex items-center gap-1 mr-2 animate-fade-in">
      {showZapi && (
        <StatusDot connected={zapiStatus?.connected ?? false} label="Z-API" />
      )}
      {showMeta && (
        <StatusDot connected={metaConnected ?? false} label="Meta" />
      )}
    </div>
  );
}
