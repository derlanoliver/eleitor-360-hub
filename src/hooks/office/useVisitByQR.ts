import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useVisitByQR(qrCode: string) {
  return useQuery({
    queryKey: ["visit_by_qr", qrCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_visits")
        .select(`
          *,
          contact:office_contacts(*),
          leader:lideres(*),
          city:office_cities(*),
          form:office_visit_forms(*)
        `)
        .eq("qr_code", qrCode)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!qrCode
  });
}
