import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Leader {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  affiliate_token: string;
}

interface SendResult {
  leader_id: string;
  nome: string;
  sms_sent: boolean;
  sms_error?: string;
  email_sent: boolean;
  email_error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[send-leader-affiliate-links] Iniciando processamento...");

    // Buscar líderes verificados com telefone e token de afiliado
    const { data: verifiedLeaders, error: leadersError } = await supabase
      .from("lideres")
      .select("id, nome_completo, telefone, email, affiliate_token")
      .eq("is_active", true)
      .eq("is_verified", true)
      .not("telefone", "is", null)
      .not("affiliate_token", "is", null);

    if (leadersError) {
      console.error("[send-leader-affiliate-links] Erro ao buscar líderes:", leadersError);
      throw new Error(`Erro ao buscar líderes: ${leadersError.message}`);
    }

    console.log(`[send-leader-affiliate-links] Total de líderes verificados: ${verifiedLeaders?.length || 0}`);

    // Buscar SMS já enviados com "link de indicacao" ou "cadastro confirmado"
    const { data: existingSMS, error: smsError } = await supabase
      .from("sms_messages")
      .select("phone, message")
      .or("message.ilike.%link de indicacao%,message.ilike.%cadastro confirmado%,message.ilike.%affiliate%");

    if (smsError) {
      console.error("[send-leader-affiliate-links] Erro ao buscar SMS:", smsError);
    }

    // Criar set de telefones que já receberam SMS
    const phonesWithSMS = new Set<string>();
    if (existingSMS) {
      existingSMS.forEach((sms) => {
        // Normalizar telefone para últimos 8 dígitos
        const normalizedPhone = sms.phone.replace(/\D/g, "").slice(-8);
        phonesWithSMS.add(normalizedPhone);
      });
    }

    console.log(`[send-leader-affiliate-links] Telefones que já receberam SMS: ${phonesWithSMS.size}`);

    // Filtrar líderes que ainda não receberam
    const pendingLeaders = (verifiedLeaders || []).filter((leader) => {
      if (!leader.telefone) return false;
      const normalizedPhone = leader.telefone.replace(/\D/g, "").slice(-8);
      return !phonesWithSMS.has(normalizedPhone);
    }) as Leader[];

    console.log(`[send-leader-affiliate-links] Líderes pendentes para envio: ${pendingLeaders.length}`);

    if (pendingLeaders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum líder pendente para envio",
          total_pending: 0,
          sent: 0,
          failed: 0,
          results: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const baseUrl = "https://app.rafaelprudente.com";
    const results: SendResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    // Processar cada líder
    for (const leader of pendingLeaders) {
      const result: SendResult = {
        leader_id: leader.id,
        nome: leader.nome_completo,
        sms_sent: false,
        email_sent: false,
      };

      const affiliateLink = `${baseUrl}/cadastro/${leader.affiliate_token}`;
      console.log(`[send-leader-affiliate-links] Processando: ${leader.nome_completo}`);

      // Enviar SMS
      if (leader.telefone) {
        try {
          const smsResponse = await supabase.functions.invoke("send-sms", {
            body: {
              phone: leader.telefone,
              templateSlug: "lider-cadastro-confirmado-sms",
              variables: {
                nome: leader.nome_completo,
                link_indicacao: affiliateLink,
              },
            },
          });

          if (smsResponse.error) {
            result.sms_error = smsResponse.error.message || "Erro desconhecido";
            console.error(`[send-leader-affiliate-links] SMS erro para ${leader.nome_completo}:`, smsResponse.error);
          } else {
            result.sms_sent = true;
            console.log(`[send-leader-affiliate-links] SMS enviado para ${leader.nome_completo}`);
          }
        } catch (smsErr) {
          result.sms_error = String(smsErr);
          console.error(`[send-leader-affiliate-links] SMS exceção para ${leader.nome_completo}:`, smsErr);
        }
      }

      // Enviar Email (se tiver)
      if (leader.email) {
        try {
          const emailResponse = await supabase.functions.invoke("send-email", {
            body: {
              to: leader.email,
              toName: leader.nome_completo,
              templateSlug: "lideranca-boas-vindas",
              variables: {
                nome: leader.nome_completo,
                link_indicacao: affiliateLink,
              },
            },
          });

          if (emailResponse.error) {
            result.email_error = emailResponse.error.message || "Erro desconhecido";
            console.error(`[send-leader-affiliate-links] Email erro para ${leader.nome_completo}:`, emailResponse.error);
          } else {
            result.email_sent = true;
            console.log(`[send-leader-affiliate-links] Email enviado para ${leader.nome_completo}`);
          }
        } catch (emailErr) {
          result.email_error = String(emailErr);
          console.error(`[send-leader-affiliate-links] Email exceção para ${leader.nome_completo}:`, emailErr);
        }
      }

      // Contar sucesso/falha
      if (result.sms_sent || result.email_sent) {
        sentCount++;
      } else {
        failedCount++;
      }

      results.push(result);

      // Delay de 2 segundos entre envios para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`[send-leader-affiliate-links] Concluído. Enviados: ${sentCount}, Falhas: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído`,
        total_pending: pendingLeaders.length,
        sent: sentCount,
        failed: failedCount,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[send-leader-affiliate-links] Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
