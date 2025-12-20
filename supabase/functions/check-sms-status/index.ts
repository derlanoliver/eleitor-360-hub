import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SMSDEV status codes mapping
const STATUS_MAP: Record<string, string> = {
  "0": "queued",
  "1": "sent",
  "2": "delivered",
  "3": "failed",
  "4": "failed",
  "FILA": "queued",
  "ENVIADO": "sent",
  "ENVIADA": "sent",
  "ENTREGUE": "delivered",
  "RECEBIDA": "delivered",
  "CLICADA": "delivered",
  "ERRO": "failed",
  "FALHA": "failed",
  "BLOQUEADO": "failed",
  "CANCELADO": "failed",
  "INVALIDO": "failed",
  "OK": "sent",
};

interface SMSMessage {
  id: string;
  message_id: string;
  phone: string;
  status: string;
  message: string;
  retry_count: number | null;
  contact_id: string | null;
}

interface SMSDEVStatusResponse {
  situacao?: string;
  status?: string;
  descricao?: string;
  codigo?: string;
}

// Helper: Extract verification code from message
function extractVerificationCode(message: string): string | null {
  // Priority 1: Code in verification links
  const linkPatterns = [
    /verificar-lider\/([A-Z0-9]{5,6})/i,
    /verificar-contato\/([A-Z0-9]{5,6})/i,
  ];
  
  for (const pattern of linkPatterns) {
    const match = message.match(pattern);
    if (match) {
      console.log(`[check-sms-status] Found code in link: ${match[1]}`);
      return match[1].toUpperCase();
    }
  }
  
  // Priority 2: "código: XXXXX" pattern
  const codigoMatch = message.match(/c[oó]digo[:\s]+([A-Z0-9]{5,6})/i);
  if (codigoMatch) {
    console.log(`[check-sms-status] Found code after 'código': ${codigoMatch[1]}`);
    return codigoMatch[1].toUpperCase();
  }
  
  // Priority 3: Alphanumeric code 5-6 chars (fallback)
  const alphaMatch = message.match(/\b([A-Z0-9]{5,6})\b/i);
  if (alphaMatch) {
    const code = alphaMatch[1].toUpperCase();
    // Exclude common words
    if (!["HTTPS", "DEPUTADO", "WHATS"].includes(code)) {
      console.log(`[check-sms-status] Found alphanumeric code: ${code}`);
      return code;
    }
  }
  
  return null;
}

// Helper: Normalize phone for queries
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Helper: Find contact or leader by phone
async function findContactOrLeader(
  supabaseUrl: string,
  supabaseServiceKey: string,
  phone: string
): Promise<{ type: "contact" | "leader" | null; id: string | null; name: string | null }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const cleanPhone = normalizePhone(phone);
  
  // Try to find unverified contact
  const { data: contact } = await supabase
    .from("office_contacts")
    .select("id, nome, is_verified")
    .or(`telefone_norm.eq.+55${cleanPhone},telefone_norm.eq.${cleanPhone},telefone_norm.eq.+${cleanPhone}`)
    .eq("is_verified", false)
    .limit(1)
    .maybeSingle();

  if (contact) {
    console.log(`[check-sms-status] Found unverified contact: ${contact.nome}`);
    return { type: "contact", id: contact.id, name: contact.nome };
  }

  // Try to find unverified leader
  const { data: leader } = await supabase
    .from("lideres")
    .select("id, nome_completo, is_verified, telefone")
    .or(`telefone.eq.+55${cleanPhone},telefone.eq.${cleanPhone},telefone.eq.+${cleanPhone},telefone.ilike.%${cleanPhone.slice(-9)}`)
    .eq("is_verified", false)
    .limit(1)
    .maybeSingle();

  if (leader) {
    console.log(`[check-sms-status] Found unverified leader: ${leader.nome_completo}`);
    return { type: "leader", id: leader.id, name: leader.nome_completo };
  }

  return { type: null, id: null, name: null };
}

// Helper: Send WhatsApp fallback message
async function sendWhatsAppFallback(
  supabaseUrl: string,
  phone: string,
  name: string,
  code: string,
  contactId: string | null
): Promise<{ success: boolean; error?: string }> {
  console.log(`[check-sms-status] Sending WhatsApp fallback to ${phone} with code ${code}`);
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZHFkdWN2c2RkY2toeWF0Y3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjg0MTYsImV4cCI6MjA3NDgwNDQxNn0.CFbMjvFsgQBevtV_B-fDTTNvvNRJ3Bwx_f4iOMXnfPA`,
      },
      body: JSON.stringify({
        phone,
        template_slug: "verificacao-sms-fallback",
        variables: {
          nome: name,
          codigo: code,
        },
        contact_id: contactId,
      }),
    });

    const result = await response.json();
    console.log(`[check-sms-status] WhatsApp fallback response:`, JSON.stringify(result));
    
    return { success: result.success === true };
  } catch (error) {
    console.error(`[check-sms-status] WhatsApp fallback error:`, error);
    return { success: false, error: (error as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[check-sms-status] Starting SMS status check...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get settings including WhatsApp fallback config
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("smsdev_api_key, smsdev_enabled, zapi_enabled, wa_auto_sms_fallback_enabled")
      .limit(1)
      .single();

    if (settingsError || !settings?.smsdev_enabled || !settings?.smsdev_api_key) {
      console.log("[check-sms-status] SMSDEV not enabled or API key not configured");
      return new Response(
        JSON.stringify({ success: false, error: "SMSDEV not enabled or API key not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const whatsappFallbackEnabled = settings.zapi_enabled && settings.wa_auto_sms_fallback_enabled;
    console.log(`[check-sms-status] WhatsApp fallback enabled: ${whatsappFallbackEnabled}`);

    // 2. Get pending messages with retry_count and message content
    const { data: pendingMessages, error: messagesError } = await supabase
      .from("sms_messages")
      .select("id, message_id, phone, status, message, retry_count, contact_id")
      .in("status", ["queued", "sent"])
      .not("message_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (messagesError) {
      console.error("[check-sms-status] Error fetching pending messages:", messagesError);
      throw messagesError;
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log("[check-sms-status] No pending messages to check");
      return new Response(
        JSON.stringify({ success: true, checked: 0, updated: 0, fallbacks: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[check-sms-status] Found ${pendingMessages.length} pending messages to check`);

    let checkedCount = 0;
    let updatedCount = 0;
    let fallbackCount = 0;
    const apiKey = settings.smsdev_api_key;

    // 3. Check each message status
    for (const msg of pendingMessages as SMSMessage[]) {
      try {
        const statusUrl = `https://api.smsdev.com.br/v1/dlr?key=${apiKey}&id=${msg.message_id}`;
        console.log(`[check-sms-status] Checking status for message ${msg.message_id}`);
        
        const response = await fetch(statusUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        checkedCount++;

        if (!response.ok) {
          console.log(`[check-sms-status] API error for message ${msg.message_id}: ${response.status}`);
          continue;
        }

        const statusData: SMSDEVStatusResponse = await response.json();
        console.log(`[check-sms-status] Status response for ${msg.message_id}:`, JSON.stringify(statusData));

        // Extract status
        let rawStatus: string | undefined;
        if (statusData.situacao === "OK" && statusData.descricao) {
          rawStatus = statusData.descricao;
        } else {
          rawStatus = statusData.situacao || statusData.status || statusData.codigo || statusData.descricao;
        }
        
        if (!rawStatus) {
          console.log(`[check-sms-status] No status in response for message ${msg.message_id}`);
          continue;
        }

        const normalizedStatus = rawStatus.toString().toUpperCase();
        const mappedStatus = STATUS_MAP[normalizedStatus] || STATUS_MAP[rawStatus];
        
        if (!mappedStatus) {
          console.log(`[check-sms-status] Unknown status ${rawStatus} for message ${msg.message_id}`);
          continue;
        }

        if (mappedStatus === msg.status) {
          console.log(`[check-sms-status] Status unchanged for message ${msg.message_id}: ${mappedStatus}`);
          continue;
        }

        console.log(`[check-sms-status] Updating message ${msg.message_id}: ${msg.status} -> ${mappedStatus}`);

        // Build update data
        const updateData: Record<string, unknown> = {
          status: mappedStatus,
          updated_at: new Date().toISOString(),
        };

        if (mappedStatus === "sent") {
          updateData.sent_at = new Date().toISOString();
        } else if (mappedStatus === "delivered") {
          updateData.delivered_at = new Date().toISOString();
          updateData.sent_at = updateData.sent_at || new Date().toISOString();
        } else if (mappedStatus === "failed") {
          updateData.error_message = statusData.descricao || `Falha no envio (código: ${rawStatus})`;
          
          // 4. WhatsApp fallback for failed messages after 6 retries
          const retryCount = msg.retry_count || 0;
          if (whatsappFallbackEnabled && retryCount >= 6) {
            console.log(`[check-sms-status] Message ${msg.message_id} failed after ${retryCount} retries, attempting WhatsApp fallback`);
            
            const code = extractVerificationCode(msg.message);
            if (code) {
              const recipient = await findContactOrLeader(supabaseUrl, supabaseServiceKey, msg.phone);
              
              if (recipient.type && recipient.id && recipient.name) {
                const fallbackResult = await sendWhatsAppFallback(
                  supabaseUrl,
                  msg.phone,
                  recipient.name,
                  code,
                  recipient.type === "contact" ? recipient.id : null
                );
                
                if (fallbackResult.success) {
                  console.log(`[check-sms-status] WhatsApp fallback sent successfully for ${msg.message_id}`);
                  updateData.status = "fallback_whatsapp";
                  fallbackCount++;
                } else {
                  console.log(`[check-sms-status] WhatsApp fallback failed for ${msg.message_id}: ${fallbackResult.error}`);
                }
              } else {
                console.log(`[check-sms-status] No unverified contact/leader found for phone ${msg.phone}`);
              }
            } else {
              console.log(`[check-sms-status] Could not extract verification code from message`);
            }
          }
        }

        // Update in database
        const { error: updateError } = await supabase
          .from("sms_messages")
          .update(updateData)
          .eq("id", msg.id);

        if (updateError) {
          console.error(`[check-sms-status] Error updating message ${msg.id}:`, updateError);
          continue;
        }

        updatedCount++;
        console.log(`[check-sms-status] Successfully updated message ${msg.message_id} to ${updateData.status}`);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));

      } catch (msgError) {
        console.error(`[check-sms-status] Error processing message ${msg.message_id}:`, msgError);
        continue;
      }
    }

    console.log(`[check-sms-status] Completed. Checked: ${checkedCount}, Updated: ${updatedCount}, Fallbacks: ${fallbackCount}`);

    return new Response(
      JSON.stringify({ success: true, checked: checkedCount, updated: updatedCount, fallbacks: fallbackCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[check-sms-status] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
