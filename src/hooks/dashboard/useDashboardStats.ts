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
      // Total de contatos
      const { count: totalContacts } = await supabase
        .from("office_contacts")
        .select("*", { count: "exact", head: true });

      // Total de líderes
      const { count: totalLeaders } = await supabase
        .from("lideres")
        .select("*", { count: "exact", head: true });

      const totalRegistrations = (totalContacts || 0) + (totalLeaders || 0);

      // Cidades alcançadas via RPC
      const { data: citiesCount } = await (supabase.rpc as any)("get_distinct_cities_count");
      const citiesReached = Number(citiesCount) || 0;

      // Líderes ativos
      const { count: activeLeaders } = await supabase
        .from("lideres")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Cidade top via RPC
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
