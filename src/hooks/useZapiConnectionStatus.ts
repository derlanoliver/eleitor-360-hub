import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ZapiConnectionStatus {
  connected: boolean;
  status?: string;
  phone?: string;
}

export function useZapiConnectionStatus(
  instanceId: string | null,
  token: string | null,
  clientToken?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["zapi-connection-status", instanceId],
    queryFn: async (): Promise<ZapiConnectionStatus> => {
      if (!instanceId || !token) {
        return { connected: false };
      }

      const { data, error } = await supabase.functions.invoke("test-zapi-connection", {
        body: { instanceId, token, clientToken },
      });

      if (error || !data?.success) {
        return { connected: false };
      }

      const connected = data.data?.connected || data.data?.status === "connected";
      const phone = data.data?.phone || data.data?.phoneNumber || data.data?.smartphoneNumber || undefined;
      return { connected, status: data.data?.status, phone };
    },
    enabled: enabled && !!instanceId && !!token,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: false,
  });
}
