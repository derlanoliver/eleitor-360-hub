import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCoordinatorDashboard(leaderId: string | undefined) {
  return useQuery({
    queryKey: ["coordinator_dashboard", leaderId],
    queryFn: async () => {
      if (!leaderId) return null;
      const { data, error } = await (supabase.rpc as any)("coordinator_get_dashboard", {
        p_leader_id: leaderId,
      });
      if (error) throw error;
      return data as any;
    },
    enabled: !!leaderId,
    staleTime: 30_000,
  });
}
