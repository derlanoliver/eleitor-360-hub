import { supabase } from "@/integrations/supabase/client";
import { generateVisitFormUrl } from "@/lib/urlHelper";
import type { WebhookPayload } from "@/types/office";

// =====================================================
// WEBHOOK SERVICE COM RESILIÊNCIA E Z-API
// =====================================================

const WEBHOOK_TIMEOUT = 5000; // 5 segundos
const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

/**
 * Verifica se Z-API está habilitado e envia via edge function
 */
async function sendViaZapi(
  visitId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { phone, message, visitId }
    });

    if (error) {
      console.error("[Webhook] Erro ao chamar send-whatsapp:", error);
      return { success: false, error: error.message };
    }

    return { success: data?.success ?? false, error: data?.error };
  } catch (err) {
    console.error("[Webhook] Exceção ao enviar via Z-API:", err);
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

/**
 * Envia notificação de visita - tenta Z-API primeiro, fallback para webhook genérico
 */
export async function sendVisitNotification(
  visitId: string,
  payload: WebhookPayload
): Promise<{ success: boolean; status?: number; error?: string }> {
  // Verificar se Z-API está habilitado
  const { data: integration } = await supabase
    .from("integrations_settings")
    .select("zapi_enabled")
    .limit(1)
    .single();

  if (integration?.zapi_enabled) {
    console.log("[Webhook] Z-API habilitado, enviando via edge function");
    
    const message = `Olá ${payload.nome}! 👋\n\nSeu link para preencher o formulário de atendimento:\n${payload.form_link}\n\nPreencha o formulário para agilizar seu atendimento.`;
    
    const result = await sendViaZapi(visitId, payload.whatsapp, message);
    
    if (result.success) {
      return { success: true };
    }
    
    console.warn("[Webhook] Falha no Z-API, usando webhook genérico como fallback");
  }

  // Fallback para webhook genérico
  const { data: settings } = await supabase
    .from("office_settings")
    .select("webhook_url")
    .maybeSingle();

  const webhookUrl = settings?.webhook_url || "https://webhook.escaladigital.ai/webhook/gabinete/envio-formulario";
  
  return postWebhook(visitId, payload, webhookUrl);
}

/**
 * Envia webhook com retry automático
 */
export async function postWebhook(
  visitId: string,
  payload: WebhookPayload,
  webhookUrl: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  let lastError: string = "";
  let lastStatus: number | undefined;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[Webhook] Tentativa ${attempt + 1}/${MAX_RETRIES} para visita ${visitId}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      lastStatus = response.status;
      
      if (response.ok) {
        console.log(`[Webhook] Sucesso na tentativa ${attempt + 1}`);
        
        // Atualizar status no banco
        await supabase
          .from("office_visits")
          .update({
            webhook_sent_at: new Date().toISOString(),
            webhook_last_status: response.status,
            webhook_error: null
          })
          .eq("id", visitId);
        
        return { success: true, status: response.status };
      }
      
      lastError = `HTTP ${response.status}: ${response.statusText}`;
      console.warn(`[Webhook] Falha na tentativa ${attempt + 1}: ${lastError}`);
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          lastError = "Timeout após 5 segundos";
        } else {
          lastError = error.message;
        }
      } else {
        lastError = "Erro desconhecido";
      }
      
      console.error(`[Webhook] Erro na tentativa ${attempt + 1}:`, lastError);
    }
    
    // Aguardar antes de tentar novamente (exceto na última tentativa)
    if (attempt < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, BACKOFF_DELAYS[attempt]));
    }
  }
  
  // Todas as tentativas falharam
  console.error(`[Webhook] Todas as ${MAX_RETRIES} tentativas falharam para visita ${visitId}`);
  
  // Atualizar erro no banco
  await supabase
    .from("office_visits")
    .update({
      webhook_sent_at: new Date().toISOString(),
      webhook_last_status: lastStatus || null,
      webhook_error: lastError
    })
    .eq("id", visitId);
  
  return { success: false, status: lastStatus, error: lastError };
}

/**
 * Tenta reenviar webhook manualmente
 */
export async function retryWebhook(visitId: string) {
  const { data: visit, error: visitError } = await supabase
    .from("office_visits")
    .select(`
      *,
      contact:office_contacts(*),
      leader:office_leaders(*),
      city:office_cities(*)
    `)
    .eq("id", visitId)
    .single();
  
  if (visitError) throw visitError;
  
  const { data: settings } = await supabase
    .from("office_settings")
    .select("webhook_url")
    .maybeSingle();
  
  const webhookUrl = settings?.webhook_url || "https://webhook.escaladigital.ai/webhook/gabinete/envio-formulario";
  
  const payload: WebhookPayload = {
    user_id: visit.contact_id,
    city_id: visit.city_id,
    leader_id: visit.leader_id,
    whatsapp: visit.contact.telefone_norm,
    nome: visit.contact.nome,
    form_link: generateVisitFormUrl(visitId)
  };
  
  return postWebhook(visitId, payload, webhookUrl);
}

/**
 * Busca status do webhook de uma visita
 */
export async function getWebhookStatus(visitId: string) {
  const { data, error } = await supabase
    .from("office_visits")
    .select("webhook_sent_at, webhook_last_status, webhook_error")
    .eq("id", visitId)
    .single();
  
  if (error) throw error;
  
  return {
    sent_at: data.webhook_sent_at,
    status: data.webhook_last_status,
    error: data.webhook_error,
    has_error: !!data.webhook_error
  };
}
