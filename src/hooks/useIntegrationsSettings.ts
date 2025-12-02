import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IntegrationsSettings {
  id: string;
  zapi_instance_id: string | null;
  zapi_token: string | null;
  zapi_client_token: string | null;
  zapi_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateIntegrationsDTO {
  zapi_instance_id?: string | null;
  zapi_token?: string | null;
  zapi_client_token?: string | null;
  zapi_enabled?: boolean;
}

export function useIntegrationsSettings() {
  return useQuery({
    queryKey: ["integrations_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as IntegrationsSettings;
    }
  });
}

export function useUpdateIntegrationsSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: UpdateIntegrationsDTO) => {
      const { data: existing } = await supabase
        .from("integrations_settings")
        .select("id")
        .limit(1)
        .single();

      if (!existing) {
        throw new Error("Configurações não encontradas");
      }

      const { data, error } = await supabase
        .from("integrations_settings")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations_settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações de integração foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useTestZapiConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: { instanceId: string; token: string; clientToken?: string }) => {
      const { data, error } = await supabase.functions.invoke('test-zapi-connection', {
        body: credentials
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    onSuccess: (data) => {
      const connected = data.connected || data.status === "connected";
      if (connected) {
        toast({
          title: "Conexão bem-sucedida",
          description: "O Z-API está conectado e funcionando.",
        });
      } else {
        toast({
          title: "WhatsApp desconectado",
          description: "A instância Z-API está ativa, mas o WhatsApp não está conectado. Verifique no painel do Z-API.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na conexão",
        description: error.message || "Verifique as credenciais e tente novamente.",
        variant: "destructive",
      });
    }
  });
}
