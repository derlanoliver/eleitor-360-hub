import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/services/office/officeService";
import type { OfficeSettings } from "@/types/office";
import { toast } from "sonner";

export function useOfficeSettings(tenantId: string) {
  return useQuery({
    queryKey: ["office_settings", tenantId],
    queryFn: () => getSettings(tenantId),
    enabled: !!tenantId
  });
}

export function useUpdateOfficeSettings(tenantId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: Partial<OfficeSettings>) =>
      updateSettings(tenantId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_settings", tenantId] });
      toast.success("Configurações atualizadas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar configurações: " + error.message);
    }
  });
}
