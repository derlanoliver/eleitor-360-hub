import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactPageView {
  id: string;
  page_type: string;
  page_identifier: string;
  page_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export function useContactPageViews(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_page_views", contactId],
    queryFn: async () => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from("contact_page_views")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []) as ContactPageView[];
    },
    enabled: !!contactId,
  });
}
