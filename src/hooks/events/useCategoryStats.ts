import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  education: "Educação",
  health: "Saúde",
  security: "Segurança",
  infrastructure: "Infraestrutura",
  culture: "Cultura",
  sports: "Esportes",
  social: "Social",
  environment: "Meio Ambiente",
  other: "Outros",
};

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
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("category");

      if (error) throw error;

      // Group by category
      const categoryMap = new Map<string, {
        totalEvents: number;
        totalRegistrations: number;
        totalCheckins: number;
      }>();

      events?.forEach((event: any) => {
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
          categoryLabel: CATEGORY_LABELS[category] || category,
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
