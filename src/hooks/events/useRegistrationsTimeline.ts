import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export interface TimelineData {
  date: string;
  registrations: number;
  checkins: number;
}

export function useRegistrationsTimeline(days: number = 30, eventId?: string) {
  return useQuery({
    queryKey: ["registrations-timeline", days, eventId],
    queryFn: async (): Promise<TimelineData[]> => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      let query = supabase
        .from("event_registrations")
        .select("created_at, checked_in")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by date
      const dateMap = new Map<string, { registrations: number; checkins: number }>();

      // Initialize all dates in range
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - i - 1), "yyyy-MM-dd");
        dateMap.set(date, { registrations: 0, checkins: 0 });
      }

      // Count registrations per day
      data?.forEach((reg: any) => {
        const date = format(new Date(reg.created_at), "yyyy-MM-dd");
        const dayData = dateMap.get(date);
        if (dayData) {
          dayData.registrations++;
          if (reg.checked_in) dayData.checkins++;
        }
      });

      // Convert to array
      return Array.from(dateMap.entries()).map(([date, stats]) => ({
        date,
        registrations: stats.registrations,
        checkins: stats.checkins,
      }));
    },
  });
}
