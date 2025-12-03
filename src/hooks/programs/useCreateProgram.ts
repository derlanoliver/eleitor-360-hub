import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateProgramData {
  nome: string;
  descricao?: string;
  status: string;
  inicio: string;
  impacto: number;
}

export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProgramData) => {
      const { data: result, error } = await supabase
        .from("programas")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast({
        title: "Programa criado",
        description: "O programa foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar programa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
