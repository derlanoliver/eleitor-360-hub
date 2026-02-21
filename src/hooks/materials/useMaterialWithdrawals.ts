import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaterialWithdrawal {
  id: string;
  material_id: string;
  leader_id: string;
  quantidade: number;
  data_retirada: string;
  confirmado: boolean;
  confirmado_at: string | null;
  observacao: string | null;
  registrado_por: string | null;
  created_at: string;
  // Joined
  material?: { nome: string; tipo: string; unidade: string };
  leader?: { nome_completo: string; telefone: string | null; status: string; cidade_id: string | null; is_coordinator: boolean | null };
  leader_city?: { nome: string } | null;
}

export function useMaterialWithdrawals(materialId?: string) {
  return useQuery({
    queryKey: ["material_withdrawals", materialId],
    queryFn: async () => {
      let query = supabase
        .from("material_withdrawals")
        .select(`
          *,
          material:campaign_materials(nome, tipo, unidade),
          leader:lideres(nome_completo, telefone, status, cidade_id, is_coordinator)
        `)
        .order("data_retirada", { ascending: false });

      if (materialId) {
        query = query.eq("material_id", materialId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch city names for leaders
      const cityIds = [...new Set((data || []).map((w: any) => w.leader?.cidade_id).filter(Boolean))];
      let cityMap: Record<string, string> = {};
      if (cityIds.length > 0) {
        const { data: cities } = await supabase
          .from("office_cities")
          .select("id, nome")
          .in("id", cityIds);
        cityMap = (cities || []).reduce((acc: Record<string, string>, c: any) => {
          acc[c.id] = c.nome;
          return acc;
        }, {});
      }

      return (data || []).map((w: any) => ({
        ...w,
        leader_city: w.leader?.cidade_id ? { nome: cityMap[w.leader.cidade_id] || "—" } : null,
      })) as MaterialWithdrawal[];
    },
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (withdrawal: {
      material_id: string;
      leader_id: string;
      quantidade: number;
      data_retirada?: string;
      observacao?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("material_withdrawals")
        .insert({
          ...withdrawal,
          registrado_por: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material_withdrawals"] });
      qc.invalidateQueries({ queryKey: ["campaign_materials"] });
      toast.success("Retirada registrada com sucesso!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar retirada"),
  });
}

export function useConfirmWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("material_withdrawals")
        .update({ confirmado: true, confirmado_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material_withdrawals"] });
      toast.success("Retirada confirmada!");
    },
    onError: () => toast.error("Erro ao confirmar retirada"),
  });
}
