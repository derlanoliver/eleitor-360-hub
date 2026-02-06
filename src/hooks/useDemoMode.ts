import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDemoMode() {
  const { user } = useAuth();

  const { data: isDemoMode = false } = useQuery({
    queryKey: ["demo-mode", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("profiles")
        .select("is_demo")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking demo mode:", error);
        return false;
      }

      return data?.is_demo === true;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return { isDemoMode };
}
