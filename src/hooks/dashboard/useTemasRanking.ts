import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemaRanking {
  tema: string;
  cadastros: number;
}

export function useTemasRanking() {
  return useQuery({
    queryKey: ["temas_ranking"],
    queryFn: async (): Promise<TemaRanking[]> => {
      // Fetch temas from office + public opinion topics in parallel
      const [temasRes, poRes] = await Promise.all([
        supabase
          .from("temas")
          .select("tema, cadastros")
          .order("cadastros", { ascending: false })
          .limit(20),
        supabase
          .from("po_sentiment_analyses")
          .select("topics")
          .gte("analyzed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1000),
      ]);

      if (temasRes.error) throw temasRes.error;

      // Build a map from temas table
      const temasMap = new Map<string, number>();
      (temasRes.data || []).forEach(t => {
        temasMap.set(t.tema.toLowerCase(), t.cadastros);
      });

      // Count PO topics and merge
      if (poRes.data && poRes.data.length > 0) {
        const topicCounts: Record<string, number> = {};
        poRes.data.forEach(row => {
          (row.topics || []).forEach((topic: string) => {
            const key = topic.toLowerCase().trim();
            if (key) topicCounts[key] = (topicCounts[key] || 0) + 1;
          });
        });

        // Merge PO topics into temas — add mentions count to matching temas or create new entries
        Object.entries(topicCounts).forEach(([topic, count]) => {
          const existing = temasMap.get(topic);
          if (existing !== undefined) {
            temasMap.set(topic, existing + count);
          } else {
            // Capitalize first letter for display
            temasMap.set(topic, count);
          }
        });
      }

      // Convert back to sorted array
      const result: TemaRanking[] = Array.from(temasMap.entries())
        .map(([tema, cadastros]) => ({
          tema: tema.charAt(0).toUpperCase() + tema.slice(1),
          cadastros,
        }))
        .sort((a, b) => b.cadastros - a.cadastros)
        .slice(0, 10);

      return result;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
