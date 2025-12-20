import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContactSearchResult {
  id: string;
  nome: string;
  telefone_norm: string;
  cidade_id: string | null;
  cidade: {
    id: string;
    nome: string;
  } | null;
  last_leader_id: string | null;
  last_leader: {
    id: string;
    nome_completo: string;
  } | null;
}

export function useSearchContactsByPhone(phone: string) {
  // Remove tudo que não for dígito
  const digitsOnly = phone.replace(/\D/g, "");
  
  return useQuery({
    queryKey: ["contacts-search-phone", digitsOnly],
    queryFn: async (): Promise<ContactSearchResult[]> => {
      if (digitsOnly.length < 3) return [];
      
      // Buscar contatos
      const { data: contacts, error } = await supabase
        .from("office_contacts")
        .select("id, nome, telefone_norm, cidade_id, cidade:office_cities(id, nome)")
        .ilike("telefone_norm", `%${digitsOnly}%`)
        .eq("is_active", true)
        .order("nome")
        .limit(10);
      
      if (error) {
        console.error("Erro ao buscar contatos:", error);
        return [];
      }
      
      if (!contacts || contacts.length === 0) return [];
      
      // Buscar o último líder de cada contato baseado nas visitas
      const contactIds = contacts.map(c => c.id);
      const { data: visits } = await supabase
        .from("office_visits")
        .select("contact_id, leader_id, created_at, leader:lideres(id, nome_completo)")
        .in("contact_id", contactIds)
        .not("leader_id", "is", null)
        .order("created_at", { ascending: false });
      
      // Mapear último líder por contato
      const lastLeaderByContact: Record<string, { id: string; nome_completo: string }> = {};
      if (visits) {
        for (const visit of visits) {
          if (visit.contact_id && !lastLeaderByContact[visit.contact_id] && visit.leader) {
            lastLeaderByContact[visit.contact_id] = visit.leader as { id: string; nome_completo: string };
          }
        }
      }
      
      // Combinar dados
      return contacts.map(contact => ({
        ...contact,
        last_leader_id: lastLeaderByContact[contact.id]?.id || null,
        last_leader: lastLeaderByContact[contact.id] || null,
      })) as ContactSearchResult[];
    },
    enabled: digitsOnly.length >= 3,
    staleTime: 1000 * 30, // 30 seconds
  });
}
