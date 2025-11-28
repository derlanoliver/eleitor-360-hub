import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLeaderByToken(affiliateToken?: string) {
  return useQuery({
    queryKey: ["leader_by_token", affiliateToken],
    queryFn: async () => {
      if (!affiliateToken) return null;
      
      const { data, error } = await supabase
        .from("lideres")
        .select("id, nome_completo, cidade_id, cidade:office_cities(nome)")
        .eq("affiliate_token", affiliateToken)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateToken
  });
}
