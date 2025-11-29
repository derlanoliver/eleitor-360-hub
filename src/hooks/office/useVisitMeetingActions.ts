import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useVisitMeetingActions() {
  const queryClient = useQueryClient();

  const completeMeeting = useMutation({
    mutationFn: async (visitId: string) => {
      const { data, error } = await supabase
        .from("office_visits")
        .update({ status: "MEETING_COMPLETED" })
        .eq("id", visitId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_visits"] });
      toast.success("Reunião marcada como realizada!");
    },
    onError: (error) => {
      console.error("Error completing meeting:", error);
      toast.error("Erro ao marcar reunião como realizada");
    }
  });

  const cancelMeeting = useMutation({
    mutationFn: async (visitId: string) => {
      const { data, error } = await supabase
        .from("office_visits")
        .update({ status: "CANCELLED" })
        .eq("id", visitId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_visits"] });
      toast.success("Reunião cancelada");
    },
    onError: (error) => {
      console.error("Error canceling meeting:", error);
      toast.error("Erro ao cancelar reunião");
    }
  });

  const rescheduleMeeting = useMutation({
    mutationFn: async ({ visitId, newDate }: { visitId: string; newDate: Date }) => {
      const { data, error } = await supabase
        .from("office_visits")
        .update({ 
          status: "RESCHEDULED",
          checked_in: false,
          checked_in_at: null,
          rescheduled_date: newDate.toISOString().split('T')[0],
          rescheduled_at: new Date().toISOString()
        })
        .eq("id", visitId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_visits"] });
      toast.success("Reunião reagendada com sucesso!");
    },
    onError: (error) => {
      console.error("Error rescheduling meeting:", error);
      toast.error("Erro ao reagendar reunião");
    }
  });

  return { completeMeeting, cancelMeeting, rescheduleMeeting };
}
