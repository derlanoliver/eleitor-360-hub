import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactWhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  direction: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  error_message: string | null;
}

export interface ContactEmailLog {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  error_message: string | null;
  template_name?: string;
}

export interface ContactCommunications {
  whatsapp: ContactWhatsAppMessage[];
  email: ContactEmailLog[];
}

export function useContactCommunications(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_communications", contactId],
    queryFn: async (): Promise<ContactCommunications> => {
      if (!contactId) return { whatsapp: [], email: [] };

      // Fetch WhatsApp messages
      const { data: whatsappMessages, error: whatsappError } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (whatsappError) {
        console.error("Error fetching WhatsApp messages:", whatsappError);
      }

      // Fetch Email logs
      const { data: emailLogs, error: emailError } = await supabase
        .from("email_logs")
        .select(`
          id,
          to_email,
          subject,
          status,
          sent_at,
          created_at,
          error_message,
          template_id,
          email_templates (
            nome
          )
        `)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (emailError) {
        console.error("Error fetching email logs:", emailError);
      }

      return {
        whatsapp: (whatsappMessages || []) as ContactWhatsAppMessage[],
        email: (emailLogs || []).map((log: any) => ({
          ...log,
          template_name: log.email_templates?.nome || null,
        })) as ContactEmailLog[],
      };
    },
    enabled: !!contactId,
  });
}
