import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateEventParams {
  coordinatorId: string;
  name: string;
  slug: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  capacity: number;
  categories: string[];
  region: string;
  coverImageUrl?: string;
  show_registrations_count: boolean;
  registration_deadline_hours: number | null;
}

export function useCoordinatorCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateEventParams) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          name: params.name,
          slug: params.slug,
          description: params.description || null,
          date: params.date,
          time: params.time,
          location: params.location,
          address: params.address || null,
          capacity: params.capacity,
          categories: params.categories,
          region: params.region,
          cover_image_url: params.coverImageUrl || null,
          show_registrations_count: params.show_registrations_count,
          registration_deadline_hours: params.registration_deadline_hours,
          created_by_coordinator_id: params.coordinatorId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinator_dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coordinator_events"] });
      toast.success("Evento criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar evento: " + error.message);
    },
  });
}

export function useCoordinatorEvents(leaderId: string | undefined) {
  return useQuery({
    queryKey: ["coordinator_events", leaderId],
    queryFn: async () => {
      if (!leaderId) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by_coordinator_id", leaderId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!leaderId,
  });
}
