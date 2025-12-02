import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactDownload {
  id: string;
  funnel_id: string | null;
  funnel_name: string;
  lead_magnet_nome: string;
  downloaded_at: string;
}

export function useContactDownloads(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_downloads", contactId],
    queryFn: async () => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from("contact_downloads")
        .select("*")
        .eq("contact_id", contactId)
        .order("downloaded_at", { ascending: false });

      if (error) throw error;

      return (data || []) as ContactDownload[];
    },
    enabled: !!contactId,
  });
}
