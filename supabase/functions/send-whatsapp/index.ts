import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendWhatsAppRequest {
  phone: string;
  message: string;
  visitId?: string;
  contactId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar credenciais do Z-API
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("zapi_instance_id, zapi_token, zapi_client_token, zapi_enabled")
      .limit(1)
      .single();

    if (settingsError) {
      console.error("[send-whatsapp] Erro ao buscar configurações:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao buscar configurações" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings?.zapi_enabled) {
      console.log("[send-whatsapp] Z-API não está habilitado");
      return new Response(
        JSON.stringify({ success: false, error: "Z-API não está habilitado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.zapi_instance_id || !settings.zapi_token) {
      console.log("[send-whatsapp] Credenciais Z-API não configuradas");
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais Z-API não configuradas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone, message, visitId, contactId }: SendWhatsAppRequest = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Telefone e mensagem são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalizar telefone (apenas números)
    const cleanPhone = phone.replace(/\D/g, "");
    
    console.log(`[send-whatsapp] Enviando mensagem para ${cleanPhone}`);

    // Criar registro da mensagem antes de enviar
    const { data: messageRecord, error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        phone: cleanPhone,
        message: message,
        direction: "outgoing",
        status: "pending",
        visit_id: visitId || null,
        contact_id: contactId || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[send-whatsapp] Erro ao registrar mensagem:", insertError);
      // Continue mesmo sem registro - não bloquear envio
    }

    // Enviar para Z-API
    const zapiUrl = `https://api.z-api.io/instances/${settings.zapi_instance_id}/token/${settings.zapi_token}/send-text`;
    
    const zapiResponse = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.zapi_client_token && { "Client-Token": settings.zapi_client_token }),
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: message,
      }),
    });

    const zapiData = await zapiResponse.json();
    
    console.log(`[send-whatsapp] Resposta Z-API:`, zapiData);

    // Atualizar registro da mensagem com resultado
    const messageId = zapiData.zapiMessageId || zapiData.messageId;
    
    if (messageRecord?.id) {
      const updateData: Record<string, unknown> = {
        status: zapiResponse.ok ? "sent" : "failed",
        sent_at: zapiResponse.ok ? new Date().toISOString() : null,
        message_id: messageId || null,
        error_message: zapiResponse.ok ? null : (zapiData.error || zapiData.message || "Erro ao enviar"),
      };

      await supabase
        .from("whatsapp_messages")
        .update(updateData)
        .eq("id", messageRecord.id);
    }

    // Atualizar office_visits se tiver visitId
    if (visitId) {
      const visitUpdateData: Record<string, unknown> = {
        webhook_sent_at: new Date().toISOString(),
        webhook_last_status: zapiResponse.status,
      };

      if (!zapiResponse.ok) {
        visitUpdateData.webhook_error = zapiData.error || zapiData.message || "Erro ao enviar mensagem";
      } else {
        visitUpdateData.webhook_error = null;
      }

      await supabase
        .from("office_visits")
        .update(visitUpdateData)
        .eq("id", visitId);
    }

    if (!zapiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: zapiData.error || zapiData.message || "Erro ao enviar mensagem",
          status: zapiResponse.status 
        }),
        { status: zapiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: zapiData,
        messageId: messageId,
        recordId: messageRecord?.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-whatsapp] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
