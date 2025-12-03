import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpdateProgramData {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  inicio: string;
  impacto: number;
}

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateProgramData) => {
      const { data: result, error } = await supabase
        .from("programas")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast({
        title: "Programa atualizado",
        description: "O programa foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar programa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
