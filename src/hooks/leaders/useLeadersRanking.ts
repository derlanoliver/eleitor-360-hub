import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LeaderRankingData {
  id: string;
  name: string;
  phone: string;
  points: number;
  registrations: number;
  events: number;
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

export function useLeadersRanking(filters?: { region?: string; period?: string }) {
  return useQuery({
    queryKey: ['leaders_ranking', filters],
    queryFn: async () => {
      let query = supabase
        .from('lideres')
        .select(`
          id,
          nome_completo,
          telefone,
          pontuacao_total,
          cadastros,
          last_activity,
          cidade_id,
          cidade:office_cities(nome),
          office_visits!leader_id(
            id,
            status,
            created_at,
            office_visit_forms(aceita_reuniao)
          )
        `)
        .eq('is_active', true);

      // Aplicar filtro de período se houver
      if (filters?.period && filters.period !== 'all' && filters.period !== 'current') {
        const dateFrom = getDateFilter(filters.period);
        if (dateFrom) {
          query = query.gte('last_activity', dateFrom);
        }
      }

      const { data, error } = await query.order('pontuacao_total', { ascending: false });
      
      if (error) throw error;

      // Processar dados
      const rankings: LeaderRankingData[] = data.map(leader => {
        const visits = leader.office_visits || [];
        const formsSubmitted = visits.filter(v => v.status === 'FORM_SUBMITTED').length;
        
        // Calcular tendência baseado em last_activity
        let trend: "up" | "down" | "stable" = "stable";
        if (leader.last_activity) {
          const daysSinceActivity = Math.floor(
            (Date.now() - new Date(leader.last_activity).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceActivity <= 15 && leader.pontuacao_total > 0) {
            trend = "up";
          } else if (daysSinceActivity > 30) {
            trend = "down";
          }
        } else if (leader.pontuacao_total === 0) {
          trend = "stable";
        }

        return {
          id: leader.id,
          name: leader.nome_completo,
          phone: leader.telefone || '',
          points: leader.pontuacao_total,
          registrations: leader.cadastros,
          events: formsSubmitted,
          region: leader.cidade?.nome || 'Sem região',
          trend,
          lastActivity: leader.last_activity
        };
      });

      // Aplicar filtro de região se houver
      if (filters?.region && filters.region !== 'all') {
        return rankings.filter(r => r.region === filters.region);
      }

      return rankings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });
}
