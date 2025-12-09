import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SMSTemplate {
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

export function useSMSTemplates() {
  return useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .order("categoria", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as SMSTemplate[];
    },
  });
}

export function useSMSTemplate(slug: string) {
  return useQuery({
    queryKey: ["sms-template", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as SMSTemplate;
    },
    enabled: !!slug,
  });
}

export function useUpdateSMSTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<SMSTemplate, "nome" | "mensagem" | "variaveis" | "is_active">>;
    }) => {
      const { error } = await supabase
        .from("sms_templates")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar template:", error);
      toast.error("Erro ao atualizar template");
    },
  });
}

export function useCreateSMSTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Pick<SMSTemplate, "slug" | "nome" | "mensagem" | "categoria" | "variaveis">
    ) => {
      const { error } = await supabase.from("sms_templates").insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template criado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar template:", error);
      toast.error("Erro ao criar template");
    },
  });
}

export function useDeleteSMSTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sms_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
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
