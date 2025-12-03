import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WhatsAppTemplate {
  id: string;
  slug: string;
  nome: string;
  mensagem: string;
  categoria: string;
  variaveis: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .order("categoria", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as WhatsAppTemplate[];
    },
  });
}

export function useWhatsAppTemplate(slug: string) {
  return useQuery({
    queryKey: ["whatsapp-template", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as WhatsAppTemplate;
    },
    enabled: !!slug,
  });
}

export function useUpdateWhatsAppTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<WhatsAppTemplate, "nome" | "mensagem" | "variaveis" | "is_active">>;
    }) => {
      const { error } = await supabase
        .from("whatsapp_templates")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast.success("Template atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar template:", error);
      toast.error("Erro ao atualizar template");
    },
  });
}

export function useCreateWhatsAppTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Pick<WhatsAppTemplate, "slug" | "nome" | "mensagem" | "categoria" | "variaveis">
    ) => {
      const { error } = await supabase.from("whatsapp_templates").insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast.success("Template criado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar template:", error);
      toast.error("Erro ao criar template");
    },
  });
}

export function useDeleteWhatsAppTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast.success("Template excluído com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao excluir template:", error);
      toast.error("Erro ao excluir template");
    },
  });
}

// Helper function to replace variables in template message
export function replaceTemplateVariables(
  mensagem: string,
  variables: Record<string, string>
): string {
  let result = mensagem;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}
