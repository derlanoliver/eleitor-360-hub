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
}

export function useSearchContactsByPhone(phone: string) {
  // Remove tudo que não for dígito
  const digitsOnly = phone.replace(/\D/g, "");
  
  return useQuery({
    queryKey: ["contacts-search-phone", digitsOnly],
    queryFn: async (): Promise<ContactSearchResult[]> => {
      if (digitsOnly.length < 3) return [];
      
      const { data, error } = await supabase
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
      
      return (data || []) as ContactSearchResult[];
    },
    enabled: digitsOnly.length >= 3,
    staleTime: 1000 * 30, // 30 seconds
  });
}
