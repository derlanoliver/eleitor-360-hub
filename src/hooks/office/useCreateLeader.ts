import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLeader } from "@/services/office/officeService";
import { toast } from "@/hooks/use-toast";
import type { CreateLeaderDTO } from "@/types/office";

export function useCreateLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeaderDTO) => createLeader(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      queryClient.invalidateQueries({ queryKey: ["office_leaders"] });
      toast({
        title: "Líder cadastrado",
        description: "O líder foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao cadastrar líder";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });
}
