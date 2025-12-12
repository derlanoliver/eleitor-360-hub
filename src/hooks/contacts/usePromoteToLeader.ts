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
      // 1. Criar líder
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
        })
        .select()
        .single();

      if (leaderError) throw leaderError;

      // 2. Registrar no histórico
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

      // 3. Enviar WhatsApp de confirmação com QR code
      try {
        const QRCode = (await import('qrcode')).default;
        const linkCadastroAfiliado = `${getBaseUrl()}/cadastro/${leader.affiliate_token}`;
        const qrCodeDataUrl = await QRCode.toDataURL(linkCadastroAfiliado, { width: 300 });
        
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: contact.telefone_norm,
            templateSlug: "lideranca-cadastro-link",
            variables: {
              nome: contact.nome,
              link_cadastro_afiliado: linkCadastroAfiliado,
            },
            imageUrl: qrCodeDataUrl,
          },
        });
        
        console.log("WhatsApp de confirmação enviado para líder promovido");
      } catch (whatsappError) {
        console.error("Erro ao enviar WhatsApp de confirmação:", whatsappError);
      }

      // 4. Enviar email de boas-vindas (se tiver email)
      if (contact.email && leader.affiliate_token) {
        try {
          const linkIndicacao = `${getBaseUrl()}/cadastro/${leader.affiliate_token}`;
          await supabase.functions.invoke("send-email", {
            body: {
              to: contact.email,
              toName: contact.nome,
              templateSlug: "lideranca-boas-vindas",
              variables: {
                nome: contact.nome,
                link_indicacao: linkIndicacao,
              },
            },
          });
          console.log("Email de boas-vindas enviado para líder promovido");
        } catch (emailError) {
          console.error("Erro ao enviar email de boas-vindas:", emailError);
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
        description: "O contato foi transformado em líder com sucesso.",
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
