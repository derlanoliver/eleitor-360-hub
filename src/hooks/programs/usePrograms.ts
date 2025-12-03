import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Program {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  inicio: string;
  impacto: number;
  created_at: string;
  updated_at: string;
}

export const usePrograms = () => {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async (): Promise<Program[]> => {
      const { data, error } = await supabase
        .from("programas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Program[];
    },
  });
};
