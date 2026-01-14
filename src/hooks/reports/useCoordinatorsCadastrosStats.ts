import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CoordinatorCadastroStats {
  id: string;
  nome_completo: string;
  cidade_nome: string | null;
  total_cadastros: number;
  verificados: number;
  pendentes: number;
  taxa_verificacao: number;
}

export function useCoordinatorsCadastrosStats() {
  return useQuery({
    queryKey: ["coordinators_cadastros_stats"],
    queryFn: async (): Promise<CoordinatorCadastroStats[]> => {
      const { data, error } = await supabase.rpc("get_coordinators_cadastros_report");

      if (error) throw error;

      return (data || []).map((item: {
        id: string;
        nome_completo: string;
        cidade_nome: string | null;
        total_cadastros: number;
        verificados: number;
        pendentes: number;
      }) => ({
        ...item,
        taxa_verificacao: item.total_cadastros > 0 
          ? (item.verificados / item.total_cadastros) * 100 
          : 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
