import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampaignMaterial {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  quantidade_produzida: number;
  estoque_atual: number;
  unidade: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCampaignMaterials() {
  return useQuery({
    queryKey: ["campaign_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_materials")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as CampaignMaterial[];
    },
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (material: { nome: string; tipo: string; descricao?: string; quantidade_produzida: number; unidade?: string }) => {
      const { data, error } = await supabase
        .from("campaign_materials")
        .insert({
          ...material,
          estoque_atual: material.quantidade_produzida,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign_materials"] });
      toast.success("Material cadastrado com sucesso!");
    },
    onError: () => toast.error("Erro ao cadastrar material"),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CampaignMaterial> & { id: string }) => {
      const { error } = await supabase
        .from("campaign_materials")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign_materials"] });
      toast.success("Material atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar material"),
  });
}

export function useAddStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantidade }: { id: string; quantidade: number }) => {
      // Get current values
      const { data: current, error: fetchErr } = await supabase
        .from("campaign_materials")
        .select("quantidade_produzida, estoque_atual")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const { error } = await supabase
        .from("campaign_materials")
        .update({
          quantidade_produzida: (current.quantidade_produzida || 0) + quantidade,
          estoque_atual: (current.estoque_atual || 0) + quantidade,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign_materials"] });
      toast.success("Estoque atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar estoque"),
  });
}
