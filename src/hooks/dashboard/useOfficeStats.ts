import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OfficeStats {
  totalVisits: number;
  pendingVisits: number;
  meetingsCompleted: number;
  checkedIn: number;
  acceptRateReuniao: number;
  recentVisits: {
    id: string;
    contactName: string;
    status: string;
    createdAt: string;
  }[];
}

export function useOfficeStats() {
  return useQuery({
    queryKey: ["office_stats"],
    queryFn: async (): Promise<OfficeStats> => {
      // Only fetch recent/active visits (limit to last 100)
      const { data: visits, error: visitsError } = await supabase
        .from("office_visits")
        .select(`
          id,
          status,
          created_at,
          contact:office_contacts(nome)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (visitsError) throw visitsError;

      // Get counts via head queries for totals
      const { count: totalVisitsCount } = await supabase
        .from("office_visits")
        .select("*", { count: "exact", head: true });

      const { count: pendingCount } = await supabase
        .from("office_visits")
        .select("*", { count: "exact", head: true })
        .in("status", ["FORM_SUBMITTED", "CHECKED_IN"]);

      const { count: meetingsCount } = await supabase
        .from("office_visits")
        .select("*", { count: "exact", head: true })
        .eq("status", "MEETING_COMPLETED");

      const { count: checkedInCount } = await supabase
        .from("office_visits")
        .select("*", { count: "exact", head: true })
        .in("status", ["CHECKED_IN", "MEETING_COMPLETED"]);

      // Taxa de aceite
      const { count: totalForms } = await supabase
        .from("office_visit_forms")
        .select("*", { count: "exact", head: true });

      const { count: acceptedMeetings } = await supabase
        .from("office_visit_forms")
        .select("*", { count: "exact", head: true })
        .eq("aceita_reuniao", true);

      const acceptRateReuniao = (totalForms || 0) > 0
        ? Math.round(((acceptedMeetings || 0) / (totalForms || 1)) * 100)
        : 0;

      // Recent active visits
      const activeStatuses = ["LINK_SENT", "FORM_SUBMITTED", "CHECKED_IN"];
      const recentVisits = (visits || [])
        .filter(v => activeStatuses.includes(v.status))
        .slice(0, 5)
        .map(v => ({
          id: v.id,
          contactName: (v.contact as any)?.nome || "Sem nome",
          status: v.status,
          createdAt: v.created_at,
        }));

      return {
        totalVisits: totalVisitsCount || 0,
        pendingVisits: pendingCount || 0,
        meetingsCompleted: meetingsCount || 0,
        checkedIn: checkedInCount || 0,
        acceptRateReuniao,
        recentVisits,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
