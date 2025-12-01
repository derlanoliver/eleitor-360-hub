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
      // Buscar todas as visitas com contato
      const { data: visits, error: visitsError } = await supabase
        .from("office_visits")
        .select(`
          id,
          status,
          created_at,
          contact:office_contacts(nome)
        `)
        .order("created_at", { ascending: false });

      if (visitsError) throw visitsError;

      // Buscar taxa de aceite de reunião dos formulários
      const { data: forms, error: formsError } = await supabase
        .from("office_visit_forms")
        .select("aceita_reuniao");

      if (formsError) throw formsError;

      const totalVisits = visits?.length || 0;
      
      // Visitas aguardando (FORM_SUBMITTED ou CHECKED_IN)
      const pendingVisits = visits?.filter(v => 
        v.status === "FORM_SUBMITTED" || v.status === "CHECKED_IN"
      ).length || 0;
      
      // Reuniões realizadas
      const meetingsCompleted = visits?.filter(v => 
        v.status === "MEETING_COMPLETED"
      ).length || 0;
      
      // Check-ins realizados
      const checkedIn = visits?.filter(v => 
        v.status === "CHECKED_IN" || v.status === "MEETING_COMPLETED"
      ).length || 0;

      // Taxa de aceite de reunião
      const totalForms = forms?.length || 0;
      const acceptedMeetings = forms?.filter(f => f.aceita_reuniao).length || 0;
      const acceptRateReuniao = totalForms > 0 
        ? Math.round((acceptedMeetings / totalForms) * 100) 
        : 0;

      // Visitas recentes na fila (LINK_SENT, FORM_SUBMITTED, CHECKED_IN)
      const activeStatuses = ["LINK_SENT", "FORM_SUBMITTED", "CHECKED_IN"];
      const recentVisits = visits
        ?.filter(v => activeStatuses.includes(v.status))
        .slice(0, 5)
        .map(v => ({
          id: v.id,
          contactName: v.contact?.nome || "Sem nome",
          status: v.status,
          createdAt: v.created_at,
        })) || [];

      return {
        totalVisits,
        pendingVisits,
        meetingsCompleted,
        checkedIn,
        acceptRateReuniao,
        recentVisits,
      };
    },
  });
}
