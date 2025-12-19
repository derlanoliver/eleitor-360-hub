import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ResendSMSParams {
  phone: string;
  message: string;
  contactId?: string;
}

export function useResendSMS() {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resend = async ({ phone, message, contactId }: ResendSMSParams) => {
    setIsResending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          phone,
          message,
          contactId,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Falha ao reenviar SMS");
      }

      toast({
        title: "SMS reenviado",
        description: "A mensagem foi enviada para a fila de envio.",
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["sms-messages"] });
      queryClient.invalidateQueries({ queryKey: ["sms-metrics"] });

      return { success: true };
    } catch (error: any) {
      console.error("Erro ao reenviar SMS:", error);
      toast({
        title: "Erro ao reenviar",
        description: error.message || "Não foi possível reenviar o SMS.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsResending(false);
    }
  };

  return { resend, isResending };
}
