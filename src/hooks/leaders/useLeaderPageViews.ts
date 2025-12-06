import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderPageView {
  id: string;
  contact_id: string;
  contact_name: string;
  page_type: string;
  page_identifier: string;
  page_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export function useLeaderPageViews(leaderId: string | undefined) {
  return useQuery({
    queryKey: ["leader_page_views", leaderId],
    queryFn: async () => {
      if (!leaderId) return [];

      // Buscar IDs dos contatos indicados pelo líder
      const { data: contacts, error: contactsError } = await supabase
        .from("office_contacts")
        .select("id, nome")
        .eq("source_type", "lider")
        .eq("source_id", leaderId);

      if (contactsError) throw contactsError;
      if (!contacts?.length) return [];

      const contactIds = contacts.map(c => c.id);
      const contactMap = new Map(contacts.map(c => [c.id, c.nome]));

      // Buscar page views desses contatos
      const { data: pageViews, error: viewsError } = await supabase
        .from("contact_page_views")
        .select("*")
        .in("contact_id", contactIds)
        .order("created_at", { ascending: false });

      if (viewsError) throw viewsError;

      // Adicionar nome do contato a cada page view
      return (pageViews || []).map(view => ({
        ...view,
        contact_name: contactMap.get(view.contact_id) || "Contato",
      })) as LeaderPageView[];
    },
    enabled: !!leaderId,
  });
}
