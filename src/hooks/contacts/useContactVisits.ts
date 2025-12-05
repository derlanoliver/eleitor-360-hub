import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactVisit {
  id: string;
  protocolo: string;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  rescheduled_date: string | null;
  leader_name: string | null;
  city_name: string | null;
}

export function useContactVisits(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_visits", contactId],
    queryFn: async (): Promise<ContactVisit[]> => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from("office_visits")
        .select(`
          id,
          protocolo,
          status,
          checked_in,
          checked_in_at,
          created_at,
          rescheduled_date,
          lideres (
            nome_completo
          ),
          office_cities (
            nome
          )
        `)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contact visits:", error);
        throw error;
      }

      return (data || []).map((visit: any) => ({
        id: visit.id,
        protocolo: visit.protocolo,
        status: visit.status,
        checked_in: visit.checked_in || false,
        checked_in_at: visit.checked_in_at,
        created_at: visit.created_at,
        rescheduled_date: visit.rescheduled_date,
        leader_name: visit.lideres?.nome_completo || null,
        city_name: visit.office_cities?.nome || null,
      }));
    },
    enabled: !!contactId,
  });
}
