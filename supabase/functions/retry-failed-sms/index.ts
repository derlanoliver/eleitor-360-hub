import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSMessage {
  id: string;
  phone: string;
  message: string;
  contact_id: string | null;
  retry_count: number;
  next_retry_at: string | null;
  error_message: string | null;
}

interface IntegrationSettings {
  smsdev_api_key: string | null;
  smsdev_enabled: boolean | null;
  zapi_enabled: boolean | null;
  wa_auto_sms_fallback_enabled: boolean | null;
}

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("55") && clean.length > 11) {
    clean = clean.substring(2);
  }
  if (clean.length === 10 && clean.startsWith("61")) {
    clean = "61" + "9" + clean.substring(2);
  }
  return clean;
}

// Extrair código de verificação de uma mensagem SMS
function extractVerificationCode(message: string): string | null {
  // Buscar padrões como "código: 12345" ou "codigo 12345" ou apenas números de 5-6 dígitos
  const patterns = [
    /c[oó]digo[:\s]*(\d{5,6})/i,
    /\b(\d{5,6})\b/
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Buscar contato ou líder associado ao telefone
async function findContactOrLeader(supabaseUrl: string, supabaseServiceKey: string, phone: string): Promise<{
  type: 'contact' | 'leader' | null;
  id: string | null;
  name: string | null;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const normalizedPhone = normalizePhone(phone);
  
  // Buscar em office_contacts
  const { data: contactData } = await supabase
    .from('office_contacts')
    .select('id, nome')
    .eq('telefone_norm', normalizedPhone)
    .eq('is_verified', false)
    .limit(1)
    .single();
  
  if (contactData) {
    const contact = contactData as { id: string; nome: string };
    return { type: 'contact', id: contact.id, name: contact.nome };
  }
  
  // Buscar em lideres
  const { data: leaderData } = await supabase
    .from('lideres')
    .select('id, nome_completo, telefone')
    .eq('is_verified', false)
    .limit(100);
  
  if (leaderData && Array.isArray(leaderData)) {
    for (const l of leaderData as Array<{ id: string; nome_completo: string; telefone: string | null }>) {
      if (l.telefone) {
        const leaderPhone = normalizePhone(l.telefone);
        if (leaderPhone === normalizedPhone) {
          return { type: 'leader', id: l.id, name: l.nome_completo };
        }
      }
    }
  }
  
  return { type: null, id: null, name: null };
}

// Enviar WhatsApp via send-whatsapp function
async function sendWhatsAppFallback(
  supabaseUrl: string,
  phone: string,
  name: string,
  code: string,
  contactId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        templateSlug: 'verificacao-sms-fallback',
        variables: {
          nome: name || 'Amigo(a)',
          codigo: code,
        },
        contactId,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao enviar WhatsApp' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[retry-failed-sms] Starting retry processing...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get SMSDEV settings and WhatsApp fallback settings
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("smsdev_api_key, smsdev_enabled, zapi_enabled, wa_auto_sms_fallback_enabled")
      .limit(1)
      .single();

    if (settingsError || !settings?.smsdev_enabled || !settings?.smsdev_api_key) {
      console.log("[retry-failed-sms] SMSDEV not configured or disabled");
      return new Response(
        JSON.stringify({ success: false, error: "SMSDEV não configurado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedSettings = settings as IntegrationSettings;
    const whatsappFallbackEnabled = typedSettings.zapi_enabled && typedSettings.wa_auto_sms_fallback_enabled;

    // Get failed SMS messages that are due for retry
    // next_retry_at <= now() AND retry_count < 6
    const { data: failedMessages, error: fetchError } = await supabase
      .from("sms_messages")
      .select("id, phone, message, contact_id, retry_count, next_retry_at, error_message")
      .eq("status", "failed")
      .lt("retry_count", 6)
      .not("next_retry_at", "is", null)
      .lte("next_retry_at", new Date().toISOString())
      .order("next_retry_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("[retry-failed-sms] Error fetching failed messages:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!failedMessages || failedMessages.length === 0) {
      console.log("[retry-failed-sms] No failed messages due for retry");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No messages to retry" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[retry-failed-sms] Found ${failedMessages.length} messages to retry`);

    const results = {
      success: 0,
      failed: 0,
      whatsapp_fallback: 0,
      details: [] as { id: string; phone: string; attempt: number; result: string }[],
    };

    for (const msg of failedMessages as SMSMessage[]) {
      const newRetryCount = msg.retry_count + 1;
      console.log(`[retry-failed-sms] Retrying SMS ${msg.id} (attempt ${newRetryCount}/6) to ${msg.phone}`);

      try {
        // Normalize phone and send
        const normalizedPhone = normalizePhone(msg.phone);
        const encodedMessage = encodeURIComponent(msg.message);
        const smsdevUrl = `https://api.smsdev.com.br/v1/send?key=${settings.smsdev_api_key}&type=9&number=${normalizedPhone}&msg=${encodedMessage}`;

        const smsResponse = await fetch(smsdevUrl);
        const smsResult = await smsResponse.json();

        console.log(`[retry-failed-sms] SMSDEV response for ${msg.id}:`, smsResult);

        if (smsResult.situacao === "OK") {
          // Success - update message
          await supabase
            .from("sms_messages")
            .update({
              message_id: smsResult.id,
              status: "queued",
              sent_at: new Date().toISOString(),
              retry_count: newRetryCount,
              next_retry_at: null,
              error_message: null,
            })
            .eq("id", msg.id);

          results.success++;
          results.details.push({
            id: msg.id,
            phone: msg.phone,
            attempt: newRetryCount,
            result: "queued",
          });

          console.log(`[retry-failed-sms] ✓ SMS ${msg.id} queued successfully on attempt ${newRetryCount}`);
        } else {
          // Failed again - check if this is the 6th attempt and fallback is enabled
          if (newRetryCount >= 6 && whatsappFallbackEnabled) {
            console.log(`[retry-failed-sms] 6th attempt failed for ${msg.id}, attempting WhatsApp fallback...`);
            
            // Extract verification code from message
            const verificationCode = extractVerificationCode(msg.message);
            
            if (verificationCode) {
              // Find contact or leader name
              const { type, id, name } = await findContactOrLeader(supabaseUrl, supabaseServiceKey, msg.phone);
              
              if (type) {
                console.log(`[retry-failed-sms] Found ${type} ${id} for phone ${msg.phone}, sending WhatsApp fallback`);
                
                const whatsappResult = await sendWhatsAppFallback(
                  supabaseUrl,
                  msg.phone,
                  name || 'Amigo(a)',
                  verificationCode,
                  type === 'contact' ? id : null
                );
                
                if (whatsappResult.success) {
                  // Mark SMS as fallback_whatsapp
                  await supabase
                    .from("sms_messages")
                    .update({
                      status: "fallback_whatsapp",
                      error_message: `Após 6 tentativas SMS, enviado via WhatsApp`,
                      retry_count: newRetryCount,
                      next_retry_at: null,
                    })
                    .eq("id", msg.id);
                  
                  results.whatsapp_fallback++;
                  results.details.push({
                    id: msg.id,
                    phone: msg.phone,
                    attempt: newRetryCount,
                    result: "fallback_whatsapp",
                  });
                  
                  console.log(`[retry-failed-sms] ✓ SMS ${msg.id} sent via WhatsApp fallback`);
                  continue;
                } else {
                  console.error(`[retry-failed-sms] WhatsApp fallback failed for ${msg.id}:`, whatsappResult.error);
                }
              } else {
                console.log(`[retry-failed-sms] No unverified contact/leader found for phone ${msg.phone}`);
              }
            } else {
              console.log(`[retry-failed-sms] No verification code found in message for ${msg.id}`);
            }
          }
          
          // Update as failed - the trigger will update next_retry_at and retry_history
          await supabase
            .from("sms_messages")
            .update({
              status: "failed",
              error_message: smsResult.descricao || "Erro no reenvio",
              retry_count: newRetryCount,
            })
            .eq("id", msg.id);

          results.failed++;
          results.details.push({
            id: msg.id,
            phone: msg.phone,
            attempt: newRetryCount,
            result: `failed: ${smsResult.descricao || "Erro"}`,
          });

          console.log(`[retry-failed-sms] ✗ SMS ${msg.id} failed on attempt ${newRetryCount}: ${smsResult.descricao}`);
        }
      } catch (sendError) {
        const errorMsg = sendError instanceof Error ? sendError.message : "Unknown error";
        console.error(`[retry-failed-sms] Error retrying SMS ${msg.id}:`, errorMsg);

        // Update with error but increment retry count
        await supabase
          .from("sms_messages")
          .update({
            status: "failed",
            error_message: `Erro de conexão: ${errorMsg}`,
            retry_count: newRetryCount,
          })
          .eq("id", msg.id);

        results.failed++;
        results.details.push({
          id: msg.id,
          phone: msg.phone,
          attempt: newRetryCount,
          result: `error: ${errorMsg}`,
        });
      }

      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const duration = Date.now() - startTime;
    console.log(`[retry-failed-sms] Completed in ${duration}ms. Success: ${results.success}, Failed: ${results.failed}, WhatsApp Fallback: ${results.whatsapp_fallback}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: failedMessages.length,
        results,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[retry-failed-sms] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
