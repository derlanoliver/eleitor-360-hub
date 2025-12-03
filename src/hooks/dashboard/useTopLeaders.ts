import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopLeader {
  id: string;
  name: string;
  phone: string;
  points: number;
  registrations: number;
  region: string;
  position: number;
  active: boolean;
}

export function useTopLeaders() {
  return useQuery({
    queryKey: ["top_leaders"],
    queryFn: async (): Promise<TopLeader[]> => {
      const { data, error } = await supabase
        .from("lideres")
        .select(`
          id, 
          nome_completo, 
          telefone, 
          pontuacao_total,
          cadastros, 
          is_active,
          cidade:office_cities(nome)
        `)
        .eq("is_active", true)
        .order("pontuacao_total", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((leader: any, index) => ({
        id: leader.id,
        name: leader.nome_completo,
        phone: leader.telefone || "",
        points: leader.pontuacao_total || 0,
        registrations: leader.cadastros || 0,
        region: leader.cidade?.nome || "Não informada",
        position: index + 1,
        active: leader.is_active,
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
