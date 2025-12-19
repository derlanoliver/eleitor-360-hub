import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopLeader {
  id: string;
  name: string;
  phone: string;
  points: number;
  indicacoes: number;
  region: string;
  position: number;
  active: boolean;
}

export function useTopLeaders() {
  return useQuery({
    queryKey: ["top_leaders"],
    queryFn: async (): Promise<TopLeader[]> => {
      const { data, error } = await supabase
        .rpc("get_top_leaders_with_indicacoes", { _limit: 10 });

      if (error) throw error;

      return (data || []).map((leader: any, index: number) => ({
        id: leader.id,
        name: leader.nome_completo,
        phone: leader.telefone || "",
        points: leader.pontuacao_total || 0,
        indicacoes: leader.indicacoes || 0,
        region: leader.cidade_nome || "Não informada",
        position: index + 1,
        active: leader.is_active,
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
