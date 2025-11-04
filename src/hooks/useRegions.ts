import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRegions() {
  return useQuery({
    queryKey: ['office_cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_cities')
        .select('*')
        .eq('status', 'active')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });
}
