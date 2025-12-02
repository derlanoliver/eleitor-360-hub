import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailLog {
  id: string;
  template_id: string | null;
  to_email: string;
  to_name: string | null;
  subject: string;
  status: string;
  resend_id: string | null;
  error_message: string | null;
  contact_id: string | null;
  leader_id: string | null;
  event_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  email_templates?: {
    nome: string;
    slug: string;
  } | null;
}

export function useEmailLogs(filters?: {
  templateId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["email_logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("email_logs")
        .select(`
          *,
          email_templates (nome, slug)
        `)
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters?.templateId) {
        query = query.eq("template_id", filters.templateId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmailLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useEmailLogStats() {
  return useQuery({
    queryKey: ["email_log_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("status");

      if (error) throw error;

      const stats = {
        total: data.length,
        sent: data.filter(l => l.status === "sent").length,
        pending: data.filter(l => l.status === "pending").length,
        failed: data.filter(l => l.status === "failed").length,
      };

      return stats;
    },
  });
}
