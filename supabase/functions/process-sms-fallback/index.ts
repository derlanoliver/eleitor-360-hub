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
  status: string;
  created_at: string;
}

interface IntegrationSettings {
  zapi_enabled: boolean | null;
  wa_auto_sms_fallback_enabled: boolean | null;
}

// Normalizar telefone para busca
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
  const patterns = [
    // Padrão 1: Extrair código do link de verificação de líder
    /verificar-lider\/([A-Z0-9]{5,6})/i,
    // Padrão 2: Extrair código do link de verificação de contato
    /verificar-contato\/([A-Z0-9]{5,6})/i,
    // Padrão 3: Código alfanumérico após "código:" ou "codigo"
    /c[oó]digo[:\s]*([A-Z0-9]{5,6})/i,
    // Padrão 4: Código alfanumérico isolado de 5-6 caracteres (excluindo palavras comuns)
    /\b([A-Z0-9]{5,6})\b/,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const code = match[1].toUpperCase();
      // Excluir palavras comuns que podem ser confundidas com códigos
      if (!["HTTPS", "DEPUTADO", "WHATS", "RAFAE", "PRUDE"].some(w => code.includes(w))) {
        console.log(`[process-sms-fallback] Extracted code: ${code} from message`);
        return code;
      }
    }
  }
  
  console.log(`[process-sms-fallback] No verification code found in message: ${message.substring(0, 100)}...`);
  return null;
}

// Buscar contato ou líder associado ao telefone
async function findContactOrLeader(
  supabaseUrl: string, 
  supabaseServiceKey: string, 
  phone: string
): Promise<{
  type: 'contact' | 'leader' | null;
  id: string | null;
  name: string | null;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const cleanPhone = normalizePhone(phone);
  const last9Digits = cleanPhone.slice(-9);
  
  console.log(`[process-sms-fallback] Searching for contact/leader with phone: ${phone}, normalized: ${cleanPhone}, last9: ${last9Digits}`);
  
  // Buscar em office_contacts pelo telefone normalizado
  const { data: contactData, error: contactError } = await supabase
    .from('office_contacts')
    .select('id, nome, telefone_norm, verification_code')
    .eq('is_verified', false)
    .or(`telefone_norm.ilike.%${last9Digits}`)
    .limit(1)
    .maybeSingle();
  
  if (contactError) {
    console.error(`[process-sms-fallback] Error searching contacts:`, contactError);
  }
  
  if (contactData) {
    console.log(`[process-sms-fallback] ✓ Found unverified contact: ${contactData.nome} (${contactData.id}), code: ${contactData.verification_code}`);
    return { type: 'contact', id: contactData.id, name: contactData.nome };
  }
  
  // Buscar em lideres pelo telefone
  const { data: leaderData, error: leaderError } = await supabase
    .from('lideres')
    .select('id, nome_completo, telefone, verification_code')
    .eq('is_verified', false)
    .eq('is_active', true)
    .or(`telefone.ilike.%${last9Digits}`)
    .limit(1)
    .maybeSingle();
  
  if (leaderError) {
    console.error(`[process-sms-fallback] Error searching leaders:`, leaderError);
  }
  
  if (leaderData) {
    console.log(`[process-sms-fallback] ✓ Found unverified leader: ${leaderData.nome_completo} (${leaderData.id}), code: ${leaderData.verification_code}`);
    return { type: 'leader', id: leaderData.id, name: leaderData.nome_completo };
  }
  
  console.log(`[process-sms-fallback] ✗ No unverified contact/leader found for phone ${phone}`);
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
  console.log(`[process-sms-fallback] Sending WhatsApp fallback to ${phone}, name: ${name}, code: ${code}`);
  
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
    console.log(`[process-sms-fallback] WhatsApp response:`, JSON.stringify(data));
    
    if (!response.ok) {
      console.error(`[process-sms-fallback] WhatsApp HTTP error: ${response.status}`, data);
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }
    
    return { success: data.success === true, error: data.error };
  } catch (error) {
    console.error(`[process-sms-fallback] WhatsApp exception:`, error);
    return { success: false, error: (error as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[process-sms-fallback] ========== Starting SMS fallback processing ==========");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar configurações de fallback
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("zapi_enabled, wa_auto_sms_fallback_enabled")
      .limit(1)
      .single();

    if (settingsError) {
      console.error("[process-sms-fallback] Error fetching settings:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao buscar configurações" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedSettings = settings as IntegrationSettings;
    
    if (!typedSettings.zapi_enabled) {
      console.log("[process-sms-fallback] Z-API not enabled, skipping fallback processing");
      return new Response(
        JSON.stringify({ success: false, error: "Z-API não está habilitado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!typedSettings.wa_auto_sms_fallback_enabled) {
      console.log("[process-sms-fallback] WhatsApp SMS fallback not enabled");
      return new Response(
        JSON.stringify({ success: false, error: "Fallback SMS->WhatsApp não está habilitado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[process-sms-fallback] ✓ WhatsApp fallback is enabled");

    // 2. Buscar mensagens SMS falhadas com 6+ tentativas que ainda não receberam fallback
    // Critérios:
    // - status = 'failed' (não 'fallback_whatsapp')
    // - retry_count >= 6
    // - Mensagem contém código de verificação (verificar-lider ou verificar-contato no texto)
    const { data: failedMessages, error: fetchError } = await supabase
      .from("sms_messages")
      .select("id, phone, message, contact_id, retry_count, status, created_at")
      .eq("status", "failed")
      .gte("retry_count", 6)
      .or("message.ilike.%verificar-lider%,message.ilike.%verificar-contato%,message.ilike.%codigo%")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("[process-sms-fallback] Error fetching failed messages:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!failedMessages || failedMessages.length === 0) {
      console.log("[process-sms-fallback] No failed messages pending fallback");
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0, 
          message: "Nenhuma mensagem pendente de fallback" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-sms-fallback] Found ${failedMessages.length} failed messages to process`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      no_code: 0,
      no_recipient: 0,
      details: [] as { id: string; phone: string; result: string }[],
    };

    // 3. Processar cada mensagem
    for (const msg of failedMessages as SMSMessage[]) {
      results.processed++;
      console.log(`\n[process-sms-fallback] Processing message ${msg.id} (${results.processed}/${failedMessages.length})`);
      console.log(`[process-sms-fallback] Phone: ${msg.phone}, retry_count: ${msg.retry_count}`);
      
      // Extrair código de verificação
      const verificationCode = extractVerificationCode(msg.message);
      
      if (!verificationCode) {
        console.log(`[process-sms-fallback] ✗ No verification code found for message ${msg.id}`);
        results.no_code++;
        results.details.push({ id: msg.id, phone: msg.phone, result: "no_code" });
        continue;
      }
      
      // Buscar destinatário (contato ou líder)
      const recipient = await findContactOrLeader(supabaseUrl, supabaseServiceKey, msg.phone);
      
      if (!recipient.type || !recipient.id) {
        console.log(`[process-sms-fallback] ✗ No unverified recipient found for ${msg.phone}`);
        results.no_recipient++;
        results.details.push({ id: msg.id, phone: msg.phone, result: "no_recipient" });
        continue;
      }
      
      // Enviar WhatsApp
      const whatsappResult = await sendWhatsAppFallback(
        supabaseUrl,
        msg.phone,
        recipient.name || 'Amigo(a)',
        verificationCode,
        recipient.type === 'contact' ? recipient.id : null
      );
      
      if (whatsappResult.success) {
        // Atualizar status da mensagem SMS para 'fallback_whatsapp'
        const { error: updateError } = await supabase
          .from("sms_messages")
          .update({
            status: "fallback_whatsapp",
            error_message: `Após ${msg.retry_count} tentativas SMS, enviado via WhatsApp`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", msg.id);
        
        if (updateError) {
          console.error(`[process-sms-fallback] Error updating message ${msg.id}:`, updateError);
        }
        
        results.success++;
        results.details.push({ id: msg.id, phone: msg.phone, result: "fallback_sent" });
        console.log(`[process-sms-fallback] ✓ WhatsApp fallback sent for ${msg.id}`);
      } else {
        results.failed++;
        results.details.push({ id: msg.id, phone: msg.phone, result: `failed: ${whatsappResult.error}` });
        console.log(`[process-sms-fallback] ✗ WhatsApp fallback failed for ${msg.id}: ${whatsappResult.error}`);
      }
      
      // Delay entre mensagens para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const duration = Date.now() - startTime;
    console.log(`\n[process-sms-fallback] ========== Completed in ${duration}ms ==========`);
    console.log(`[process-sms-fallback] Results: processed=${results.processed}, success=${results.success}, failed=${results.failed}, no_code=${results.no_code}, no_recipient=${results.no_recipient}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.processed,
        fallback_success: results.success,
        fallback_failed: results.failed,
        no_code: results.no_code,
        no_recipient: results.no_recipient,
        details: results.details,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[process-sms-fallback] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
