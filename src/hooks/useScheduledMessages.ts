import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScheduledMessage {
  id: string;
  message_type: "sms" | "email" | "whatsapp";
  recipient_phone: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  template_slug: string;
  variables: Record<string, string>;
  scheduled_for: string;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
  contact_id: string | null;
  leader_id: string | null;
  batch_id: string | null;
}

export interface CreateScheduledMessage {
  message_type: "sms" | "email" | "whatsapp";
  recipient_phone?: string;
  recipient_email?: string;
  recipient_name?: string;
  template_slug: string;
  variables?: Record<string, string>;
  scheduled_for: string;
  contact_id?: string;
  leader_id?: string;
  batch_id?: string;
}

export function useScheduledMessages(filters?: {
  status?: string;
  messageType?: string;
  batchId?: string;
}) {
  return useQuery({
    queryKey: ["scheduled-messages", filters],
    queryFn: async () => {
      let query = supabase
        .from("scheduled_messages")
        .select("*")
        .order("scheduled_for", { ascending: true });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.messageType) {
        query = query.eq("message_type", filters.messageType);
      }
      if (filters?.batchId) {
        query = query.eq("batch_id", filters.batchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduledMessage[];
    },
  });
}

export function useCreateScheduledMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messages: CreateScheduledMessage[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const messagesWithUser = messages.map((msg) => ({
        ...msg,
        created_by: userId,
      }));

      const { data, error } = await supabase
        .from("scheduled_messages")
        .insert(messagesWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-messages"] });
    },
  });
}

export function useCancelScheduledMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from("scheduled_messages")
        .update({ status: "cancelled" })
        .in("id", messageIds)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-messages"] });
    },
  });
}

export function useCancelScheduledBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from("scheduled_messages")
        .update({ status: "cancelled" })
        .eq("batch_id", batchId)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-messages"] });
    },
  });
}

export function useScheduledMessageStats() {
  return useQuery({
    queryKey: ["scheduled-messages-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_messages")
        .select("status, message_type");

      if (error) throw error;

      const stats = {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        byType: {
          sms: 0,
          email: 0,
          whatsapp: 0,
        },
      };

      data?.forEach((msg) => {
        stats[msg.status as keyof typeof stats]++;
        if (msg.status === "pending") {
          stats.byType[msg.message_type as keyof typeof stats.byType]++;
        }
      });

      return stats;
    },
  });
}
