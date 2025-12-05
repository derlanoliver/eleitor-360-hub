import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactEventParticipation {
  id: string;
  event_id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_address: string | null;
  event_category: string;
  event_slug: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

export function useContactEventParticipation(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_event_participation", contactId],
    queryFn: async () => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          event_id,
          checked_in,
          checked_in_at,
          created_at,
          events (
            id,
            name,
            date,
            time,
            location,
            address,
            category,
            slug
          )
        `)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((reg: any) => ({
        id: reg.id,
        event_id: reg.event_id,
        event_name: reg.events?.name || "Evento sem nome",
        event_date: reg.events?.date || "",
        event_time: reg.events?.time || "",
        event_location: reg.events?.location || "",
        event_address: reg.events?.address || null,
        event_category: reg.events?.category || "",
        event_slug: reg.events?.slug || "",
        checked_in: reg.checked_in || false,
        checked_in_at: reg.checked_in_at,
        created_at: reg.created_at,
      })) as ContactEventParticipation[];
    },
    enabled: !!contactId,
  });
}
