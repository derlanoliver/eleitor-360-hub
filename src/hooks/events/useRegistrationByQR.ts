import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRegistrationByQR(qrCode: string) {
  return useQuery({
    queryKey: ["registration_by_qr", qrCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          event:events(*),
          cidade:office_cities(nome)
        `)
        .eq("qr_code", qrCode)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!qrCode,
    retry: false
  });
}
