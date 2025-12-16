import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderIndicatedContact {
  id: string;
  nome: string;
  telefone_norm: string;
  email: string | null;
  cidade: { nome: string } | null;
  is_verified: boolean;
  verified_at: string | null;
  is_active: boolean;
  created_at: string;
}

export function useLeaderIndicatedContacts(leaderId: string | undefined) {
  return useQuery({
    queryKey: ["leader_indicated_contacts", leaderId],
    queryFn: async (): Promise<LeaderIndicatedContact[]> => {
      if (!leaderId) return [];

      const { data, error } = await supabase
        .from("office_contacts")
        .select(`
          id,
          nome,
          telefone_norm,
          email,
          is_verified,
          verified_at,
          is_active,
          created_at,
          cidade:office_cities(nome)
        `)
        .eq("source_type", "lider")
        .eq("source_id", leaderId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!leaderId,
    staleTime: 0,
    refetchOnMount: true,
  });
}
