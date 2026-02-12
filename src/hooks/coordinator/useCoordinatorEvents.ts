import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      const { data, error } = await (supabase.rpc as any)("coordinator_create_event", {
        p_coordinator_id: params.coordinatorId,
        p_name: params.name,
        p_slug: params.slug,
        p_description: params.description || null,
        p_date: params.date,
        p_time: params.time,
        p_location: params.location,
        p_address: params.address || null,
        p_capacity: params.capacity,
        p_categories: params.categories,
        p_region: params.region,
        p_cover_image_url: params.coverImageUrl || null,
        p_show_registrations_count: params.show_registrations_count,
        p_registration_deadline_hours: params.registration_deadline_hours,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinator_dashboard"] });
      toast.success("Evento criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar evento: " + error.message);
    },
  });
}
