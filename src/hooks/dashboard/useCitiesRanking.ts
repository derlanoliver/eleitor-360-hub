import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CityRanking {
  name: string;
  value: number;
}

export function useCitiesRanking() {
  return useQuery({
    queryKey: ["cities_ranking"],
    queryFn: async (): Promise<CityRanking[]> => {
      const { data: contacts } = await supabase
        .from("office_contacts")
        .select("cidade_id, office_cities(nome)")
        .not("cidade_id", "is", null);

      const cityCount = (contacts || []).reduce((acc, contact) => {
        const cityName = (contact.office_cities as any)?.nome || "Outros";
        acc[cityName] = (acc[cityName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(cityCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
