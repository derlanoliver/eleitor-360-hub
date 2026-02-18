import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Update Entity ──
export function useUpdateEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("po_monitored_entities")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["po_monitored_entities"] });
      toast.success("Entidade atualizada com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Delete (deactivate) Entity ──
export function useDeleteEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("po_monitored_entities")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["po_monitored_entities"] });
      toast.success("Entidade desativada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Collection Configs ──
export function useCollectionConfigs(entityId?: string) {
  return useQuery({
    queryKey: ["po_collection_configs", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("po_collection_configs")
        .select("*")
        .eq("entity_id", entityId!)
        .order("provider");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertCollectionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: {
      id?: string;
      entity_id: string;
      provider: string;
      is_active: boolean;
      run_interval_minutes?: number;
    }) => {
      if (config.id) {
        const { error } = await supabase
          .from("po_collection_configs")
          .update({
            is_active: config.is_active,
            run_interval_minutes: config.run_interval_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("po_collection_configs")
          .insert([{
            entity_id: config.entity_id,
            provider: config.provider,
            is_active: config.is_active,
            run_interval_minutes: config.run_interval_minutes || 60,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["po_collection_configs"] });
      toast.success("Configuração salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
