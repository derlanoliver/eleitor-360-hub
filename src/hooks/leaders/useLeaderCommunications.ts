import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderWhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  direction: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface LeaderEmailLog {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function useLeaderCommunications(leaderId: string | undefined, leaderPhone: string | undefined, leaderEmail: string | undefined) {
  // WhatsApp messages por telefone
  const whatsappQuery = useQuery({
    queryKey: ["leader_whatsapp", leaderPhone],
    queryFn: async (): Promise<LeaderWhatsAppMessage[]> => {
      if (!leaderPhone) return [];
      
      // Normalizar telefone para formato E.164
      const normalizedPhone = leaderPhone.replace(/\D/g, '');
      const phoneVariants = [
        normalizedPhone,
        `+${normalizedPhone}`,
        `+55${normalizedPhone}`,
        normalizedPhone.slice(-11), // Últimos 11 dígitos
      ];
      
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .or(phoneVariants.map(p => `phone.ilike.%${p.slice(-8)}%`).join(","))
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!leaderPhone,
  });

  // Email logs por leader_id ou email
  const emailQuery = useQuery({
    queryKey: ["leader_emails", leaderId, leaderEmail],
    queryFn: async (): Promise<LeaderEmailLog[]> => {
      if (!leaderId && !leaderEmail) return [];
      
      let query = supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (leaderId) {
        query = query.eq("leader_id", leaderId);
      } else if (leaderEmail) {
        query = query.eq("to_email", leaderEmail);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!(leaderId || leaderEmail),
  });

  return {
    whatsappMessages: whatsappQuery.data || [],
    emailLogs: emailQuery.data || [],
    isLoading: whatsappQuery.isLoading || emailQuery.isLoading,
  };
}
