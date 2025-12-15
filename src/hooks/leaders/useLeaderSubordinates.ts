import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderSubordinate {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  cidade: { nome: string } | null;
  is_active: boolean;
  created_at: string;
  pontuacao_total: number;
  cadastros: number;
  hierarchy_level: number | null;
}

export function useLeaderSubordinates(leaderId: string | undefined) {
  return useQuery({
    queryKey: ["leader_subordinates", leaderId],
    queryFn: async (): Promise<LeaderSubordinate[]> => {
      if (!leaderId) return [];
      
      const { data, error } = await supabase
        .from("lideres")
        .select(`
          id,
          nome_completo,
          telefone,
          email,
          is_active,
          created_at,
          pontuacao_total,
          cadastros,
          hierarchy_level,
          cidade:office_cities(nome)
        `)
        .eq("parent_leader_id", leaderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!leaderId,
  });
}

// Hook to get count of direct subordinates for multiple leaders
export function useLeadersSubordinatesCounts(leaderIds: string[]) {
  return useQuery({
    queryKey: ["leaders_subordinates_counts", leaderIds],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!leaderIds.length) return {};
      
      const { data, error } = await supabase
        .from("lideres")
        .select("parent_leader_id")
        .in("parent_leader_id", leaderIds);

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      leaderIds.forEach(id => counts[id] = 0);
      
      data?.forEach(item => {
        if (item.parent_leader_id) {
          counts[item.parent_leader_id] = (counts[item.parent_leader_id] || 0) + 1;
        }
      });
      
      return counts;
    },
    enabled: leaderIds.length > 0,
  });
}
