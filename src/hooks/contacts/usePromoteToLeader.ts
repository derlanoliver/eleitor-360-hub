import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getBaseUrl } from "@/lib/urlHelper";

interface PromoteToLeaderParams {
  contact: {
    id: string;
    nome: string;
    telefone_norm: string;
    email?: string | null;
    cidade_id: string;
    data_nascimento?: string | null;
  };
  actionBy: string;
}

export function usePromoteToLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contact, actionBy }: PromoteToLeaderParams) => {
      // 1. Gerar código de verificação
      const { data: verificationCode, error: codeError } = await supabase
        .rpc("generate_leader_verification_code");

      if (codeError) throw codeError;

      // 2. Criar líder com is_verified = false
      const { data: leader, error: leaderError } = await supabase
        .from("lideres")
        .insert({
          nome_completo: contact.nome,
          telefone: contact.telefone_norm,
          email: contact.email || null,
          cidade_id: contact.cidade_id,
          data_nascimento: contact.data_nascimento || null,
          is_active: true,
          status: "active",
          cadastros: 0,
          pontuacao_total: 0,
          is_verified: false,
          verification_code: verificationCode,
        })
        .select()
        .single();

      if (leaderError) throw leaderError;

      // 3. Registrar no histórico
      const { error: logError } = await supabase
        .from("contact_activity_log")
        .insert({
          contact_id: contact.id,
          action: "promoted_to_leader",
          action_by: actionBy,
          details: {
            leader_id: leader.id,
            leader_name: leader.nome_completo,
          },
        });

      if (logError) {
        console.error("Erro ao registrar histórico:", logError);
      }

      // 4. Enviar SMS de VERIFICAÇÃO (não o link de afiliado ainda)
      try {
        const verificationLink = `${getBaseUrl()}/verificar-lider/${verificationCode}`;
        await supabase.functions.invoke("send-sms", {
          body: {
            phone: contact.telefone_norm,
            templateSlug: "verificacao-lider-sms",
            variables: {
              nome: contact.nome,
              link_verificacao: verificationLink,
            },
          },
        });

        // Atualizar verification_sent_at
        await supabase.rpc("update_leader_verification_sent", {
          _leader_id: leader.id,
        });

        console.log("SMS de verificação enviado para novo líder");
      } catch (smsError) {
        console.error("Erro ao enviar SMS de verificação:", smsError);
      }

      // 5. Enviar email informativo (sem link de afiliado, apenas confirmando cadastro)
      if (contact.email) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: contact.email,
              toName: contact.nome,
              templateSlug: "lideranca-aguardando-verificacao",
              variables: {
                nome: contact.nome,
              },
            },
          });
          console.log("Email de confirmação de cadastro enviado");
        } catch (emailError) {
          console.error("Erro ao enviar email:", emailError);
        }
      }

      return leader;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      queryClient.invalidateQueries({ queryKey: ["office_leaders"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact_activity_log"] });
      toast({
        title: "Contato promovido",
        description: "O contato foi transformado em líder. SMS de verificação enviado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao promover contato a líder",
        variant: "destructive",
      });
    },
  });
}
