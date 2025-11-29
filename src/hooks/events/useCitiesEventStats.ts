import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CityEventStat {
  cityId: string;
  cityName: string;
  registrations: number;
  checkins: number;
  conversionRate: number;
}

export function useCitiesEventStats(eventId?: string) {
  return useQuery({
    queryKey: ["cities-event-stats", eventId],
    queryFn: async (): Promise<CityEventStat[]> => {
      let query = supabase
        .from("event_registrations")
        .select(`
          cidade_id,
          checked_in,
          office_cities!inner(nome)
        `)
        .not("cidade_id", "is", null);

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by city
      const cityMap = new Map<string, {
        name: string;
        registrations: number;
        checkins: number;
      }>();

      data?.forEach((reg: any) => {
        const cityId = reg.cidade_id;
        const cityName = reg.office_cities?.nome || "Desconhecida";
        const isCheckedIn = reg.checked_in || false;

        if (!cityMap.has(cityId)) {
          cityMap.set(cityId, {
            name: cityName,
            registrations: 0,
            checkins: 0,
          });
        }

        const city = cityMap.get(cityId)!;
        city.registrations++;
        if (isCheckedIn) city.checkins++;
      });

      // Convert to array and calculate conversion rates
      const cities: CityEventStat[] = Array.from(cityMap.entries()).map(
        ([cityId, stats]) => ({
          cityId,
          cityName: stats.name,
          registrations: stats.registrations,
          checkins: stats.checkins,
          conversionRate:
            stats.registrations > 0
              ? (stats.checkins / stats.registrations) * 100
              : 0,
        })
      );

      // Sort by registrations descending
      return cities.sort((a, b) => b.registrations - a.registrations);
    },
  });
}
