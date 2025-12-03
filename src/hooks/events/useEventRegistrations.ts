import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizePhoneToE164 } from "@/utils/phoneNormalizer";

export function useEventRegistrations(eventId?: string) {
  return useQuery({
    queryKey: ["event_registrations", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          cidade:office_cities(nome)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId
  });
}

type CreateRegistrationData = {
  event_id: string;
  nome: string;
  email: string;
  whatsapp: string;
  cidade_id?: string;
  leader_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRegistrationData) => {
      // Check if already registered
      const { data: existing } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", data.event_id)
        .eq("email", data.email)
        .maybeSingle();

      if (existing) {
        throw new Error("Você já está inscrito neste evento!");
      }

      // Check if phone/email belongs to a leader - mark the registration accordingly
      let isLeader = false;
      try {
        const telefone_norm = normalizePhoneToE164(data.whatsapp);
        const { data: existingLeader } = await supabase
          .from('lideres')
          .select('id')
          .or(`telefone.eq.${telefone_norm},email.eq.${data.email}`)
          .maybeSingle();
        
        if (existingLeader) {
          isLeader = true;
          console.log('Registrant is a leader, skipping contact creation');
        }
      } catch (e) {
        // Ignore phone normalization errors
      }

      // Create registration (contact_id will be null for leaders to avoid duplicate contact)
      const { data: registration, error } = await supabase
        .from("event_registrations")
        .insert({
          ...data,
          // If the registrant is a leader, we don't link to a contact to avoid duplication
          contact_id: isLeader ? null : undefined,
        })
        .select()
        .single();

      if (error) throw error;
      return registration;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event_registrations", variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useUpdateCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, checked_in }: { id: string; checked_in: boolean }) => {
      const { data, error } = await supabase
        .from("event_registrations")
        .update({ 
          checked_in,
          checked_in_at: checked_in ? new Date().toISOString() : null
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event_registrations", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(data.checked_in ? "Check-in realizado!" : "Check-in desfeito!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar check-in: " + error.message);
    }
  });
}
