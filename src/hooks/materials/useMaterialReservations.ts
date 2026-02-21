import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaterialReservation {
  id: string;
  material_id: string;
  leader_id: string;
  quantidade: number;
  status: string;
  reserved_at: string;
  expires_at: string;
  withdrawn_at: string | null;
  cancelled_at: string | null;
  observacao: string | null;
  created_at: string;
  // Joined
  material?: { nome: string; tipo: string; unidade: string };
  leader?: { nome_completo: string; telefone: string | null; is_coordinator: boolean | null; cidade_id: string | null };
  leader_city?: { nome: string } | null;
}

export function useMaterialReservations(filters?: { leader_id?: string; status?: string }) {
  return useQuery({
    queryKey: ["material_reservations", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("material_reservations")
        .select(`
          *,
          material:campaign_materials(nome, tipo, unidade),
          leader:lideres(nome_completo, telefone, is_coordinator, cidade_id)
        `)
        .order("reserved_at", { ascending: false });

      if (filters?.leader_id) query = query.eq("leader_id", filters.leader_id);
      if (filters?.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch city names
      const cityIds = [...new Set((data || []).map((r: any) => r.leader?.cidade_id).filter(Boolean))] as string[];
      let cityMap: Record<string, string> = {};
      if (cityIds.length > 0) {
        const { data: cities } = await supabase.from("office_cities").select("id, nome").in("id", cityIds);
        cityMap = (cities || []).reduce((acc: Record<string, string>, c: any) => { acc[c.id] = c.nome; return acc; }, {});
      }

      return (data || []).map((r: any) => ({
        ...r,
        leader_city: r.leader?.cidade_id ? { nome: cityMap[r.leader.cidade_id] || "—" } : null,
      })) as MaterialReservation[];
    },
    refetchInterval: 60_000, // Refresh every minute for countdown
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { material_id: string; leader_id: string; quantidade: number; observacao?: string }) => {
      const { data: result, error } = await (supabase as any)
        .from("material_reservations")
        .insert({
          material_id: data.material_id,
          leader_id: data.leader_id,
          quantidade: data.quantidade,
          observacao: data.observacao || null,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material_reservations"] });
      qc.invalidateQueries({ queryKey: ["campaign_materials"] });
      toast.success("Material reservado! Você tem 3 dias para retirar.");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao reservar material"),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("material_reservations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material_reservations"] });
      qc.invalidateQueries({ queryKey: ["campaign_materials"] });
      toast.success("Reserva cancelada, material devolvido ao estoque.");
    },
    onError: () => toast.error("Erro ao cancelar reserva"),
  });
}
