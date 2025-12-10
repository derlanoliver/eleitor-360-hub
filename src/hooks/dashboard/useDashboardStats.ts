import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalRegistrations: number;
  citiesReached: number;
  activeLeaders: number;
  topCity: string;
  topCityCount: number;
  lastRegistration: string | null;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Total de cadastros
      const { count: totalRegistrations } = await supabase
        .from("office_contacts")
        .select("*", { count: "exact", head: true });

      // Cidades alcançadas (distintas)
      const { data: cities } = await supabase
        .from("office_contacts")
        .select("cidade_id")
        .not("cidade_id", "is", null);
      
      const citiesReached = new Set(cities?.map(c => c.cidade_id)).size;

      // Líderes ativos
      const { count: activeLeaders } = await supabase
        .from("lideres")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Cidade com mais cadastros - via RPC (evita limite de 1000 registros)
      const { data: topCityData } = await supabase.rpc("get_top_city");

      const topCity = topCityData?.[0]?.city_name || "N/A";
      const topCityCount = topCityData?.[0]?.city_count || 0;

      // Último cadastro
      const { data: lastContact } = await supabase
        .from("office_contacts")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        totalRegistrations: totalRegistrations || 0,
        citiesReached,
        activeLeaders: activeLeaders || 0,
        topCity,
        topCityCount,
        lastRegistration: lastContact?.created_at || null,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}
