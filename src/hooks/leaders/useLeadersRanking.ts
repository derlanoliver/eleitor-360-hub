import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LeaderRankingData {
  id: string;
  name: string;
  phone: string;
  points: number;
  indicacoes: number;
  region: string;
  trend: "up" | "down" | "stable";
  lastActivity: string | null;
}

const getDateFilter = (period: string) => {
  const now = new Date();
  switch(period) {
    case 'current':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case 'last':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3)).toISOString();
    case 'year':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return null;
  }
};

const calculateTrend = (lastActivity: string | null, points: number): "up" | "down" | "stable" => {
  if (lastActivity) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceActivity <= 15 && points > 0) {
      return "up";
    } else if (daysSinceActivity > 30) {
      return "down";
    }
  } else if (points === 0) {
    return "stable";
  }
  return "stable";
};

export function useLeadersRanking(filters?: { region?: string; period?: string }) {
  return useQuery({
    queryKey: ['leaders_ranking', filters],
    queryFn: async () => {
      // Usar a nova RPC que calcula indicações
      const { data, error } = await supabase
        .rpc("get_leaders_ranking_with_indicacoes");
      
      if (error) throw error;

      // Processar dados
      let rankings: LeaderRankingData[] = (data || []).map((leader: {
        id: string;
        nome_completo: string;
        telefone: string | null;
        pontuacao_total: number;
        indicacoes: number;
        cidade_nome: string | null;
        last_activity: string | null;
      }) => ({
        id: leader.id,
        name: leader.nome_completo,
        phone: leader.telefone || '',
        points: leader.pontuacao_total,
        indicacoes: leader.indicacoes,
        region: leader.cidade_nome || 'Sem região',
        trend: calculateTrend(leader.last_activity, leader.pontuacao_total),
        lastActivity: leader.last_activity
      }));

      // Aplicar filtro de período se houver
      if (filters?.period && filters.period !== 'all' && filters.period !== 'current') {
        const dateFrom = getDateFilter(filters.period);
        if (dateFrom) {
          rankings = rankings.filter(r => 
            r.lastActivity && new Date(r.lastActivity) >= new Date(dateFrom)
          );
        }
      }

      // Aplicar filtro de região se houver
      if (filters?.region && filters.region !== 'all') {
        rankings = rankings.filter(r => r.region === filters.region);
      }

      return rankings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });
}
