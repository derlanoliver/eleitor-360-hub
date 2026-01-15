import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

interface IntegrationsSettings {
  id: string;
  zapi_instance_id: string | null;
  zapi_token: string | null;
  zapi_client_token: string | null;
  zapi_enabled: boolean;
  resend_api_key: string | null;
  resend_from_email: string | null;
  resend_from_name: string | null;
  resend_enabled: boolean;
  smsdev_api_key: string | null;
  smsdev_enabled: boolean;
  // SMSBarato
  smsbarato_api_key: string | null;
  smsbarato_enabled: boolean;
  // Disparopro
  disparopro_usuario: string | null;
  disparopro_senha: string | null;
  disparopro_enabled: boolean;
  sms_active_provider: 'smsdev' | 'smsbarato' | 'disparopro';
  // PassKit
  passkit_api_token: string | null;
  passkit_api_base_url: string | null;
  passkit_program_id: string | null;
  passkit_tier_id: string | null;
  passkit_enabled: boolean;
  // Controles de mensagens automáticas de WhatsApp
  wa_auto_verificacao_enabled: boolean;
  wa_auto_captacao_enabled: boolean;
  wa_auto_pesquisa_enabled: boolean;
  wa_auto_evento_enabled: boolean;
  wa_auto_lideranca_enabled: boolean;
  wa_auto_membro_enabled: boolean;
  wa_auto_visita_enabled: boolean;
  wa_auto_optout_enabled: boolean;
  wa_auto_sms_fallback_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateIntegrationsDTO {
  zapi_instance_id?: string | null;
  zapi_token?: string | null;
  zapi_client_token?: string | null;
  zapi_enabled?: boolean;
  resend_api_key?: string | null;
  resend_from_email?: string | null;
  resend_from_name?: string | null;
  resend_enabled?: boolean;
  smsdev_api_key?: string | null;
  smsdev_enabled?: boolean;
  // SMSBarato
  smsbarato_api_key?: string | null;
  smsbarato_enabled?: boolean;
  // Disparopro
  disparopro_usuario?: string | null;
  disparopro_senha?: string | null;
  disparopro_enabled?: boolean;
  sms_active_provider?: 'smsdev' | 'smsbarato' | 'disparopro';
  // PassKit
  passkit_api_token?: string | null;
  passkit_api_base_url?: string | null;
  passkit_program_id?: string | null;
  passkit_tier_id?: string | null;
  passkit_enabled?: boolean;
  // Controles de mensagens automáticas de WhatsApp
  wa_auto_verificacao_enabled?: boolean;
  wa_auto_captacao_enabled?: boolean;
  wa_auto_pesquisa_enabled?: boolean;
  wa_auto_evento_enabled?: boolean;
  wa_auto_lideranca_enabled?: boolean;
  wa_auto_membro_enabled?: boolean;
  wa_auto_visita_enabled?: boolean;
  wa_auto_optout_enabled?: boolean;
  wa_auto_sms_fallback_enabled?: boolean;
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

export function useTestSmsdevConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const { data, error } = await supabase.functions.invoke('test-smsdev-connection', {
        body: { apiKey }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Conexão bem-sucedida",
        description: data.description || `Saldo disponível: ${data.balance} SMS`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na conexão",
        description: error.message || "Verifique a API Key e tente novamente.",
        variant: "destructive",
      });
    }
  });
}

export function useTestSmsbaratoConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const { data, error } = await supabase.functions.invoke('test-smsbarato-connection', {
        body: { apiKey }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Conexão bem-sucedida",
        description: data.description || `Saldo disponível: ${data.balance} SMS`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na conexão",
        description: error.message || "Verifique a API Key e tente novamente.",
        variant: "destructive",
      });
    }
  });
}

export function useTestSmsdevWebhook() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('test-smsdev-webhook');

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      toast.success("Webhook testado com sucesso!", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("Erro ao testar webhook", {
        description: error.message,
      });
    }
  });
}

export function useTestDisparoproConnection() {
  const { toast: toastHook } = useToast();

  return useMutation({
    mutationFn: async (credentials: { usuario: string; senha: string }) => {
      const { data, error } = await supabase.functions.invoke('test-disparopro-connection', {
        body: credentials
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    onSuccess: (data) => {
      toastHook({
        title: "Conexão bem-sucedida",
        description: data.description || `Saldo disponível: ${data.balance} SMS`,
      });
    },
    onError: (error) => {
      toastHook({
        title: "Erro na conexão",
        description: error.message || "Verifique as credenciais e tente novamente.",
        variant: "destructive",
      });
    }
  });
}
