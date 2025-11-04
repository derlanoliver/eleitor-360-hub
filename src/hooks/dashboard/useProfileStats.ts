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
      // Distribuição de gênero
      const { data: contacts } = await supabase
        .from("office_contacts")
        .select("genero, data_nascimento");

      const genderCount = (contacts || []).reduce((acc, contact) => {
        const gender = contact.genero || "Não identificado";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = contacts?.length || 0;
      const generoData = Object.entries(genderCount).map(([label, count]) => ({
        label,
        valor: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

      // Idade média (apenas para contatos com data de nascimento)
      const ages = (contacts || [])
        .filter(c => c.data_nascimento)
        .map(c => {
          const birthDate = new Date(c.data_nascimento!);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        })
        .filter(age => age >= 0 && age <= 120); // Filtrar idades válidas

      const idade_media = ages.length > 0
        ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
        : 0;

      // Participação em eventos (contatos com visitas com status FORM_SUBMITTED ou CHECKED_IN)
      const { data: visits } = await supabase
        .from("office_visits")
        .select("contact_id, status")
        .in("status", ["FORM_SUBMITTED", "CHECKED_IN"]);

      const contactsWithVisits = new Set(visits?.map(v => v.contact_id));
      const participacao_eventos_pct = total > 0
        ? Math.round((contactsWithVisits.size / total) * 100)
        : 0;

      return {
        genero: generoData,
        idade_media,
        participacao_eventos_pct,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
