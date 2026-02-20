import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook centralizado de Realtime para o módulo de Opinião Pública.
 * Escuta mudanças nas tabelas po_mentions, po_sentiment_analyses,
 * po_daily_snapshots e po_monitored_entities e invalida as queries
 * correspondentes automaticamente — sem precisar recarregar a página.
 */
export function usePublicOpinionRealtime(entityId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    // Canal único para todas as tabelas PO
    const channel = supabase
      .channel("po-realtime-updates")
      // Novas menções coletadas
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "po_mentions",
          ...(entityId ? { filter: `entity_id=eq.${entityId}` } : {}),
        },
        () => {
          qc.invalidateQueries({ queryKey: ["po_mentions"] });
          // Também invalida o overview que agrega dados de menções
          qc.invalidateQueries({ queryKey: ["po_sentiment_analyses"] });
        }
      )
      // Novas análises de sentimento
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "po_sentiment_analyses",
          ...(entityId ? { filter: `entity_id=eq.${entityId}` } : {}),
        },
        () => {
          qc.invalidateQueries({ queryKey: ["po_sentiment_analyses"] });
          qc.invalidateQueries({ queryKey: ["po_mentions"] });
        }
      )
      // Snapshots diários agregados
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "po_daily_snapshots",
          ...(entityId ? { filter: `entity_id=eq.${entityId}` } : {}),
        },
        () => {
          qc.invalidateQueries({ queryKey: ["po_daily_snapshots"] });
        }
      )
      // Entidades monitoradas (cadastro de nova entidade, edição de config)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "po_monitored_entities",
        },
        () => {
          qc.invalidateQueries({ queryKey: ["po_monitored_entities"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId, qc]);
}
