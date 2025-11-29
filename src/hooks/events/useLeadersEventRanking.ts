import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderEventStat {
  leaderId: string;
  leaderName: string;
  cityName: string | null;
  registrations: number;
  checkins: number;
  conversionRate: number;
}

export function useLeadersEventRanking(eventId?: string) {
  return useQuery({
    queryKey: ["leaders-event-ranking", eventId],
    queryFn: async (): Promise<LeaderEventStat[]> => {
      let query = supabase
        .from("event_registrations")
        .select(`
          leader_id,
          checked_in,
          lideres!inner(nome_completo, cidade_id, office_cities(nome))
        `)
        .not("leader_id", "is", null);

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by leader
      const leaderMap = new Map<string, {
        name: string;
        city: string | null;
        registrations: number;
        checkins: number;
      }>();

      data?.forEach((reg: any) => {
        const leaderId = reg.leader_id;
        const leaderName = reg.lideres?.nome_completo || "Desconhecido";
        const cityName = reg.lideres?.office_cities?.nome || null;
        const isCheckedIn = reg.checked_in || false;

        if (!leaderMap.has(leaderId)) {
          leaderMap.set(leaderId, {
            name: leaderName,
            city: cityName,
            registrations: 0,
            checkins: 0,
          });
        }

        const leader = leaderMap.get(leaderId)!;
        leader.registrations++;
        if (isCheckedIn) leader.checkins++;
      });

      // Convert to array and calculate conversion rates
      const leaders: LeaderEventStat[] = Array.from(leaderMap.entries()).map(
        ([leaderId, stats]) => ({
          leaderId,
          leaderName: stats.name,
          cityName: stats.city,
          registrations: stats.registrations,
          checkins: stats.checkins,
          conversionRate:
            stats.registrations > 0
              ? (stats.checkins / stats.registrations) * 100
              : 0,
        })
      );

      // Sort by registrations descending and take top 10
      return leaders.sort((a, b) => b.registrations - a.registrations).slice(0, 10);
    },
  });
}
