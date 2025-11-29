import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Tema {
  id: string;
  tema: string;
  cadastros: number;
}

export function useTemas() {
  return useQuery({
    queryKey: ["temas"],
    queryFn: async (): Promise<Tema[]> => {
      const { data, error } = await supabase
        .from("temas")
        .select("id, tema, cadastros")
        .order("tema", { ascending: true });

      if (error) throw error;

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
