import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface ChatbotConfig {
  id: string;
  is_enabled: boolean;
  use_ai_for_unknown: boolean;
  welcome_message: string | null;
  fallback_message: string | null;
  ai_system_prompt: string | null;
  max_messages_per_hour: number;
  created_at: string;
  updated_at: string;
}

export interface ChatbotKeyword {
  id: string;
  keyword: string;
  aliases: string[];
  description: string | null;
  response_type: "static" | "dynamic" | "ai";
  static_response: string | null;
  dynamic_function: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ChatbotLog {
  id: string;
  leader_id: string | null;
  phone: string;
  message_in: string;
  message_out: string | null;
  keyword_matched: string | null;
  response_type: string | null;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  leader?: {
    nome_completo: string;
  };
}

// Hook for chatbot config
export function useChatbotConfig() {
  return useQuery({
    queryKey: ["chatbot-config"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_chatbot_config")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as ChatbotConfig;
    }
  });
}

// Hook for updating chatbot config
export function useUpdateChatbotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<ChatbotConfig>) => {
      const { data: existing } = await (supabase as any)
        .from("whatsapp_chatbot_config")
        .select("id")
        .limit(1)
        .single();

      if (!existing) {
        const { data, error } = await (supabase as any)
          .from("whatsapp_chatbot_config")
          .insert(updates)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await (supabase as any)
        .from("whatsapp_chatbot_config")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-config"] });
      toast.success("Configurações atualizadas!");
    },
    onError: (error) => {
      console.error("Error updating config:", error);
      toast.error("Erro ao atualizar configurações");
    }
  });
}

// Hook for keywords
export function useChatbotKeywords() {
  return useQuery({
    queryKey: ["chatbot-keywords"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_chatbot_keywords")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as ChatbotKeyword[];
    }
  });
}

// Hook for creating keyword
export function useCreateChatbotKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyword: Omit<ChatbotKeyword, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_chatbot_keywords")
        .insert(keyword)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-keywords"] });
      toast.success("Palavra-chave criada!");
    },
    onError: (error) => {
      console.error("Error creating keyword:", error);
      toast.error("Erro ao criar palavra-chave");
    }
  });
}

// Hook for updating keyword
export function useUpdateChatbotKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChatbotKeyword> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_chatbot_keywords")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-keywords"] });
      toast.success("Palavra-chave atualizada!");
    },
    onError: (error) => {
      console.error("Error updating keyword:", error);
      toast.error("Erro ao atualizar palavra-chave");
    }
  });
}

// Hook for deleting keyword
export function useDeleteChatbotKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("whatsapp_chatbot_keywords")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-keywords"] });
      toast.success("Palavra-chave removida!");
    },
    onError: (error) => {
      console.error("Error deleting keyword:", error);
      toast.error("Erro ao remover palavra-chave");
    }
  });
}

// Hook for chatbot logs
export function useChatbotLogs(limit = 50) {
  return useQuery({
    queryKey: ["chatbot-logs", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_chatbot_logs")
        .select(`
          *,
          leader:lideres(nome_completo)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ChatbotLog[];
    }
  });
}

// Available dynamic functions for reference
export const AVAILABLE_DYNAMIC_FUNCTIONS = [
  { value: "minha_arvore", label: "Minha Árvore", description: "Mostra estatísticas da rede do líder" },
  { value: "meus_cadastros", label: "Meus Cadastros", description: "Lista os últimos cadastros indicados" },
  { value: "minha_pontuacao", label: "Minha Pontuação", description: "Mostra pontos e nível de gamificação" },
  { value: "minha_posicao", label: "Minha Posição", description: "Mostra posição no ranking geral" },
  { value: "meus_subordinados", label: "Meus Subordinados", description: "Lista líderes diretamente abaixo" },
  { value: "ajuda", label: "Ajuda", description: "Lista de comandos disponíveis" }
];
