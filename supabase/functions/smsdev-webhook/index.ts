import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SMSDEV status codes mapping
// Based on SMSDEV documentation:
// 0 = Na fila | 1 = Enviado | 2 = Entregue | 3 = Erro/Falha | 4 = Bloqueado
const STATUS_MAP: Record<string, string> = {
  "0": "queued",
  "1": "sent",
  "2": "delivered",
  "3": "failed",
  "4": "failed",
  // Text-based statuses
  "FILA": "queued",
  "ENVIADO": "sent",
  "ENTREGUE": "delivered",
  "RECEBIDA": "delivered",
  "ERRO": "failed",
  "FALHA": "failed",
  "BLOQUEADO": "failed",
  "CANCELADO": "failed",
  "INVALIDO": "failed",
};

interface SMSDEVWebhookPayload {
  id?: string;
  msg_id?: string;
  message_id?: string;
  situacao?: string;
  status?: string;
  codigo?: string;
  code?: string;
  descricao?: string;
  description?: string;
  telefone?: string;
  phone?: string;
  data?: string;
  date?: string;
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

    // Parse request body - SMSDEV may send as form-urlencoded or JSON
    let body: SMSDEVWebhookPayload;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries()) as unknown as SMSDEVWebhookPayload;
    } else {
      body = await req.json();
    }
    
    console.log("[smsdev-webhook] Received webhook:", JSON.stringify(body));

    // Extract message ID from multiple possible fields
    const messageId = body.id || body.msg_id || body.message_id;
    
    if (!messageId) {
      console.log("[smsdev-webhook] No message ID found in payload");
      return new Response(
        JSON.stringify({ success: false, error: "No message ID provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract status from multiple possible fields
    const rawStatus = body.situacao || body.status || body.codigo || body.code;
    
    if (!rawStatus) {
      console.log("[smsdev-webhook] No status found in payload");
      return new Response(
        JSON.stringify({ success: false, error: "No status provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map SMSDEV status to our internal status
    const normalizedStatus = rawStatus.toString().toUpperCase();
    const mappedStatus = STATUS_MAP[normalizedStatus] || STATUS_MAP[rawStatus] || "pending";
    
    console.log(`[smsdev-webhook] Processing message ${messageId}: ${rawStatus} -> ${mappedStatus}`);

    // Build update data
    const updateData: Record<string, unknown> = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps based on status
    if (mappedStatus === "sent") {
      updateData.sent_at = new Date().toISOString();
    } else if (mappedStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString();
      // Also set sent_at if not already set
      if (!updateData.sent_at) {
        updateData.sent_at = new Date().toISOString();
      }
    } else if (mappedStatus === "failed") {
      // Extract error description from multiple possible fields
      const errorDescription = body.descricao || body.description || 
        `Falha no envio (código: ${rawStatus})`;
      updateData.error_message = errorDescription;
    }

    // Log the message_id we're looking for
    console.log(`[smsdev-webhook] Looking for message with message_id: ${messageId}`);

    // Update the SMS message record
    const { data, error, count } = await supabase
      .from("sms_messages")
      .update(updateData)
      .eq("message_id", messageId)
      .select("id, message_id, status");

    if (error) {
      console.error("[smsdev-webhook] Error updating message status:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[smsdev-webhook] Update result:`, { data, count });
    console.log(`[smsdev-webhook] Message ${messageId} updated to ${mappedStatus}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messageId,
        status: mappedStatus,
        updated: data?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[smsdev-webhook] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
