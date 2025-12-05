import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeactivateContactParams {
  contactId: string;
  reason: string;
  userId?: string;
}

export function useDeactivateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, reason, userId }: DeactivateContactParams) => {
      const { data, error } = await supabase
        .from("office_contacts")
        .update({
          is_active: false,
          opted_out_at: new Date().toISOString(),
          opt_out_reason: reason,
          opt_out_channel: "admin",
        })
        .eq("id", contactId)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico de atividades
      if (userId) {
        await supabase.from("contact_activity_log").insert({
          contact_id: contactId,
          action: "deactivated",
          action_by: userId,
          details: { reason },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-total-count"] });
      queryClient.invalidateQueries({ queryKey: ["contact_activity_log"] });
      toast.success("Contato desativado com sucesso");
    },
    onError: (error: any) => {
      console.error("Error deactivating contact:", error);
      toast.error(error?.message || "Erro ao desativar contato");
    },
  });
}

export function useReactivateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, userId }: { contactId: string; userId?: string }) => {
      const { data, error } = await supabase
        .from("office_contacts")
        .update({
          is_active: true,
          opted_out_at: null,
          opt_out_reason: null,
          opt_out_channel: null,
        })
        .eq("id", contactId)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico de atividades
      if (userId) {
        await supabase.from("contact_activity_log").insert({
          contact_id: contactId,
          action: "reactivated",
          action_by: userId,
          details: {},
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["contacts"] });
      queryClient.refetchQueries({ queryKey: ["contacts-total-count"] });
      queryClient.invalidateQueries({ queryKey: ["contact_activity_log"] });
      toast.success("Contato reativado! Ele agora aparece na lista de 'Ativos'.");
    },
    onError: (error: any) => {
      console.error("Error reactivating contact:", error);
      toast.error(error?.message || "Erro ao reativar contato");
    },
  });
}
