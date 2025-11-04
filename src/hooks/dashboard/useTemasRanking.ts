import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemaRanking {
  tema: string;
  cadastros: number;
}

export function useTemasRanking() {
  return useQuery({
    queryKey: ["temas_ranking"],
    queryFn: async (): Promise<TemaRanking[]> => {
      const { data, error } = await supabase
        .from("temas")
        .select("tema, cadastros")
        .order("cadastros", { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
