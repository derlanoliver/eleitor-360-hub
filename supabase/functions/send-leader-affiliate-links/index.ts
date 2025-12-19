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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional limit from body
    let limit = 50; // Default batch size
    try {
      const body = await req.json();
      if (body?.limit) limit = Math.min(body.limit, 100);
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`[send-leader-affiliate-links] Iniciando com limite: ${limit}`);

    // Buscar líderes verificados HOJE que ainda não receberam SMS de link
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar SMS já enviados com "link de indicacao" ou "cadastro confirmado"
    const { data: existingSMS } = await supabase
      .from("sms_messages")
      .select("phone")
      .or("message.ilike.%link de indicacao%,message.ilike.%cadastro confirmado%,message.ilike.%affiliate%");

    const phonesWithSMS = new Set<string>();
    if (existingSMS) {
      existingSMS.forEach((sms) => {
        const normalized = sms.phone.replace(/\D/g, "").slice(-8);
        phonesWithSMS.add(normalized);
      });
    }

    console.log(`[send-leader-affiliate-links] ${phonesWithSMS.size} telefones já receberam SMS`);

    // Buscar líderes verificados hoje
    const { data: verifiedLeaders, error: leadersError } = await supabase
      .from("lideres")
      .select("id, nome_completo, telefone, email, affiliate_token")
      .eq("is_active", true)
      .eq("is_verified", true)
      .not("telefone", "is", null)
      .not("affiliate_token", "is", null)
      .gte("verified_at", `${today}T00:00:00`)
      .order("verified_at", { ascending: false });

    if (leadersError) {
      console.error("[send-leader-affiliate-links] Erro:", leadersError);
      throw new Error(leadersError.message);
    }

    // Filtrar apenas os que não receberam SMS
    const pendingLeaders = (verifiedLeaders || []).filter((leader) => {
      if (!leader.telefone) return false;
      const normalized = leader.telefone.replace(/\D/g, "").slice(-8);
      return !phonesWithSMS.has(normalized);
    }).slice(0, limit) as Leader[];

    console.log(`[send-leader-affiliate-links] ${pendingLeaders.length} líderes pendentes (de ${verifiedLeaders?.length || 0} verificados hoje)`);

    if (pendingLeaders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum líder pendente",
          total_pending: 0,
          sent: 0,
          failed: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = "https://app.rafaelprudente.com";
    const results: SendResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

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
            result.sms_error = smsResponse.error.message || "Erro";
            console.error(`[send-leader-affiliate-links] SMS erro:`, smsResponse.error);
          } else {
            result.sms_sent = true;
            console.log(`[send-leader-affiliate-links] SMS OK: ${leader.nome_completo}`);
          }
        } catch (smsErr) {
          result.sms_error = String(smsErr);
        }
      }

      // Enviar Email
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
            result.email_error = emailResponse.error.message || "Erro";
          } else {
            result.email_sent = true;
            console.log(`[send-leader-affiliate-links] Email OK: ${leader.nome_completo}`);
          }
        } catch (emailErr) {
          result.email_error = String(emailErr);
        }
      }

      if (result.sms_sent || result.email_sent) {
        sentCount++;
      } else {
        failedCount++;
      }

      results.push(result);

      // Delay menor entre envios
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[send-leader-affiliate-links] Concluído. Enviados: ${sentCount}, Falhas: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processados ${pendingLeaders.length} líderes`,
        total_pending: pendingLeaders.length,
        sent: sentCount,
        failed: failedCount,
        results: results.slice(0, 10), // Retornar apenas primeiros 10 para não sobrecarregar
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-leader-affiliate-links] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});