import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryStat {
  category: string;
  categoryLabel: string;
  totalEvents: number;
  totalRegistrations: number;
  totalCheckins: number;
  conversionRate: number;
  averageRegistrationsPerEvent: number;
}

export function useCategoryStats() {
  return useQuery({
    queryKey: ["category-stats"],
    queryFn: async (): Promise<CategoryStat[]> => {
      // Buscar eventos e temas em paralelo
      const [eventsResult, temasResult] = await Promise.all([
        supabase.from("events").select("*").order("category"),
        supabase.from("temas").select("id, tema"),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (temasResult.error) throw temasResult.error;

      const events = eventsResult.data || [];
      const temas = temasResult.data || [];

      // Criar mapa de labels
      const temasMap = new Map<string, string>();
      temas.forEach((tema) => {
        // Mapeia tanto pelo slug quanto pelo nome original
        const slug = tema.tema
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_");
        temasMap.set(slug, tema.tema);
        temasMap.set(tema.tema.toLowerCase(), tema.tema);
      });

      // Group by category
      const categoryMap = new Map<string, {
        totalEvents: number;
        totalRegistrations: number;
        totalCheckins: number;
      }>();

      events.forEach((event: any) => {
        const category = event.category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            totalEvents: 0,
            totalRegistrations: 0,
            totalCheckins: 0,
          });
        }

        const stats = categoryMap.get(category)!;
        stats.totalEvents++;
        stats.totalRegistrations += event.registrations_count || 0;
        stats.totalCheckins += event.checkedin_count || 0;
      });

      // Convert to array and calculate metrics
      const categories: CategoryStat[] = Array.from(categoryMap.entries()).map(
        ([category, stats]) => ({
          category,
          categoryLabel: temasMap.get(category) || temasMap.get(category.toLowerCase()) || category,
          totalEvents: stats.totalEvents,
          totalRegistrations: stats.totalRegistrations,
          totalCheckins: stats.totalCheckins,
          conversionRate:
            stats.totalRegistrations > 0
              ? (stats.totalCheckins / stats.totalRegistrations) * 100
              : 0,
          averageRegistrationsPerEvent:
            stats.totalEvents > 0
              ? stats.totalRegistrations / stats.totalEvents
              : 0,
        })
      );

      // Sort by total registrations descending
      return categories.sort((a, b) => b.totalRegistrations - a.totalRegistrations);
    },
  });
}
