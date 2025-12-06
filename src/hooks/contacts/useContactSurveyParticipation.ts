import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContactSurveyParticipation(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_survey_participation", contactId],
    queryFn: async () => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from("survey_responses")
        .select(`
          id,
          created_at,
          respostas,
          survey:surveys(id, titulo, slug)
        `)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });
}
