import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  genero: Array<{ label: string; valor: number }>;
  idade_media: number;
  participacao_eventos_pct: number;
}

export function useProfileStats() {
  return useQuery({
    queryKey: ["profile_stats"],
    queryFn: async (): Promise<ProfileData> => {
      const { data, error } = await (supabase.rpc as any)("get_profile_stats");
      if (error) throw error;

      const result = data as any;
      const totalContacts = result.total_contacts || 0;
      const genderArr = result.genero || [];

      const generoData = genderArr.map((g: any) => ({
        label: g.label,
        valor: totalContacts > 0 ? Math.round((g.count / totalContacts) * 100) : 0,
      }));

      const contactsWithCheckin = result.contacts_with_checkin || 0;
      const participacao_eventos_pct = totalContacts > 0
        ? Math.round((contactsWithCheckin / totalContacts) * 100)
        : 0;

      return {
        genero: generoData,
        idade_media: result.idade_media || 0,
        participacao_eventos_pct,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
