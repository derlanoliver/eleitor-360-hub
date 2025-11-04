import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopLeader {
  id: string;
  name: string;
  phone: string;
  registrations: number;
  position: number;
  active: boolean;
}

export function useTopLeaders() {
  return useQuery({
    queryKey: ["top_leaders"],
    queryFn: async (): Promise<TopLeader[]> => {
      const { data, error } = await supabase
        .from("lideres")
        .select("id, nome_completo, telefone, cadastros, is_active")
        .eq("is_active", true)
        .order("cadastros", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((leader, index) => ({
        id: leader.id,
        name: leader.nome_completo,
        phone: leader.telefone || "",
        registrations: leader.cadastros,
        position: index + 1,
        active: leader.is_active,
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
