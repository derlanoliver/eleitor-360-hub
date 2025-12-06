import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderMapData {
  id: string;
  nome_completo: string;
  cadastros: number;
  pontuacao_total: number;
  latitude: number;
  longitude: number;
  cidade_nome: string;
}

export interface ContactMapData {
  id: string;
  nome: string;
  source_type: string | null;
  source_id: string | null;
  latitude: number;
  longitude: number;
  cidade_nome: string;
}

export interface CityMapData {
  id: string;
  nome: string;
  codigo_ra: string;
  latitude: number;
  longitude: number;
  leaders_count: number;
  contacts_count: number;
}

export function useStrategicMapData() {
  // Fetch leaders with city coordinates
  const leadersQuery = useQuery({
    queryKey: ["strategic_map_leaders"],
    queryFn: async (): Promise<LeaderMapData[]> => {
      const { data, error } = await supabase
        .from("lideres")
        .select(`
          id,
          nome_completo,
          cadastros,
          pontuacao_total,
          cidade:office_cities(id, nome, latitude, longitude)
        `)
        .eq("is_active", true);

      if (error) throw error;

      return (data || [])
        .filter((l: any) => l.cidade?.latitude && l.cidade?.longitude)
        .map((l: any) => ({
          id: l.id,
          nome_completo: l.nome_completo,
          cadastros: l.cadastros || 0,
          pontuacao_total: l.pontuacao_total || 0,
          latitude: l.cidade.latitude,
          longitude: l.cidade.longitude,
          cidade_nome: l.cidade.nome,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch contacts with city coordinates and source_id for connections
  const contactsQuery = useQuery({
    queryKey: ["strategic_map_contacts"],
    queryFn: async (): Promise<ContactMapData[]> => {
      const { data, error } = await supabase
        .from("office_contacts")
        .select(`
          id,
          nome,
          source_type,
          source_id,
          cidade:office_cities(id, nome, latitude, longitude)
        `)
        .eq("is_active", true)
        .range(0, 9999);

      if (error) throw error;

      console.log("Strategic Map - Total contacts fetched from DB:", data?.length);

      const filtered = (data || [])
        .filter((c: any) => c.cidade?.latitude && c.cidade?.longitude)
        .map((c: any) => ({
          id: c.id,
          nome: c.nome,
          source_type: c.source_type,
          source_id: c.source_id,
          latitude: c.cidade.latitude,
          longitude: c.cidade.longitude,
          cidade_nome: c.cidade.nome,
        }));

      console.log("Strategic Map - Contacts with valid coordinates:", filtered.length);

      return filtered;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch cities with aggregated counts
  const citiesQuery = useQuery({
    queryKey: ["strategic_map_cities"],
    queryFn: async (): Promise<CityMapData[]> => {
      const { data: cities, error: citiesError } = await supabase
        .from("office_cities")
        .select("id, nome, codigo_ra, latitude, longitude")
        .eq("status", "active");

      if (citiesError) throw citiesError;

      // Get leader counts per city
      const { data: leaderCounts } = await supabase
        .from("lideres")
        .select("cidade_id")
        .eq("is_active", true);

      // Get contact counts per city
      const { data: contactCounts } = await supabase
        .from("office_contacts")
        .select("cidade_id")
        .eq("is_active", true)
        .range(0, 9999);

      const leadersByCity = (leaderCounts || []).reduce((acc: Record<string, number>, l) => {
        if (l.cidade_id) {
          acc[l.cidade_id] = (acc[l.cidade_id] || 0) + 1;
        }
        return acc;
      }, {});

      const contactsByCity = (contactCounts || []).reduce((acc: Record<string, number>, c) => {
        if (c.cidade_id) {
          acc[c.cidade_id] = (acc[c.cidade_id] || 0) + 1;
        }
        return acc;
      }, {});

      return (cities || [])
        .filter((c: any) => c.latitude && c.longitude)
        .map((c: any) => ({
          id: c.id,
          nome: c.nome,
          codigo_ra: c.codigo_ra,
          latitude: c.latitude,
          longitude: c.longitude,
          leaders_count: leadersByCity[c.id] || 0,
          contacts_count: contactsByCity[c.id] || 0,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    leaders: leadersQuery.data || [],
    contacts: contactsQuery.data || [],
    cities: citiesQuery.data || [],
    isLoading: leadersQuery.isLoading || contactsQuery.isLoading || citiesQuery.isLoading,
    error: leadersQuery.error || contactsQuery.error || citiesQuery.error,
  };
}
