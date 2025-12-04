import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UpdateMemberData {
  userId: string;
  role?: AppRole;
  isActive?: boolean;
  name?: string;
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, isActive, name }: UpdateMemberData) => {
      // Update role if provided
      if (role) {
        // Check if user already has a role in user_roles
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingRole) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .update({ role })
            .eq("user_id", userId);

          if (roleError) throw roleError;
        } else {
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role });

          if (insertError) throw insertError;
        }

        // TAMBÉM atualizar profiles.role para manter sincronizado
        const { error: profileRoleError } = await supabase
          .from("profiles")
          .update({ role })
          .eq("id", userId);

        if (profileRoleError) {
          console.error("Erro ao sincronizar role em profiles:", profileRoleError);
          // Não falha a operação principal, apenas loga
        }
      }

      // Update is_active if provided
      if (typeof isActive === "boolean") {
        const { error: userError } = await supabase
          .from("users")
          .update({ is_active: isActive })
          .eq("id", userId);

        if (userError) throw userError;
      }

      // Update name if provided
      if (name) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ name })
          .eq("id", userId);

        if (profileError) throw profileError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Membro atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar membro:", error);
      toast.error("Erro ao atualizar membro");
    },
  });
}
