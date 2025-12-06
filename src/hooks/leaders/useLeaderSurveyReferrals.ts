import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLeaderSurveyReferrals(leaderId: string | undefined) {
  return useQuery({
    queryKey: ["leader_survey_referrals", leaderId],
    queryFn: async () => {
      if (!leaderId) return { ownResponses: [], referredResponses: [] };

      // Own responses (leader answered)
      const { data: ownResponses, error: ownError } = await supabase
        .from("survey_responses")
        .select(`
          id,
          created_at,
          survey:surveys(id, titulo, slug)
        `)
        .eq("leader_id", leaderId)
        .eq("is_leader", true)
        .order("created_at", { ascending: false });

      if (ownError) throw ownError;

      // Referred responses (leader indicated someone)
      const { data: referredResponses, error: refError } = await supabase
        .from("survey_responses")
        .select(`
          id,
          created_at,
          survey:surveys(id, titulo, slug),
          contact:office_contacts(id, nome)
        `)
        .eq("referred_by_leader_id", leaderId)
        .order("created_at", { ascending: false });

      if (refError) throw refError;

      return { ownResponses: ownResponses || [], referredResponses: referredResponses || [] };
    },
    enabled: !!leaderId,
  });
}
