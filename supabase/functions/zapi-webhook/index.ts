import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ZapiMessageStatus {
  zapiMessageId?: string;
  messageId?: string;
  status?: string;
  phone?: { user?: string } | string;
  chatId?: string;
  isStatusReply?: boolean;
}

interface ZapiReceivedMessage {
  zapiMessageId?: string;
  messageId?: string;
  phone?: string;
  chatId?: string;
  text?: { message?: string };
  fromMe?: boolean;
  senderName?: string;
}

interface ZapiConnectionStatus {
  connected?: boolean;
  status?: string;
  error?: string;
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

    const body = await req.json();
    
    console.log("[zapi-webhook] Received webhook:", JSON.stringify(body));

    // Detect webhook type based on payload structure
    const webhookType = detectWebhookType(body);
    console.log("[zapi-webhook] Detected webhook type:", webhookType);

    switch (webhookType) {
      case "message-status":
        await handleMessageStatus(supabase, body as ZapiMessageStatus);
        break;
      case "received-message":
        await handleReceivedMessage(supabase, body as ZapiReceivedMessage);
        break;
      case "connection-status":
        await handleConnectionStatus(supabase, body as ZapiConnectionStatus);
        break;
      default:
        console.log("[zapi-webhook] Unknown webhook type, logging only");
    }

    return new Response(
      JSON.stringify({ success: true, type: webhookType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[zapi-webhook] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectWebhookType(body: Record<string, unknown>): string {
  // Message status update
  if (body.status && (body.zapiMessageId || body.messageId)) {
    return "message-status";
  }
  
  // Received message
  if (body.text || (body.phone && !body.status)) {
    return "received-message";
  }
  
  // Connection status
  if (body.connected !== undefined || body.status === "connected" || body.status === "disconnected") {
    return "connection-status";
  }
  
  return "unknown";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMessageStatus(supabase: any, data: ZapiMessageStatus) {
  const messageId = data.zapiMessageId || data.messageId;
  const status = data.status?.toLowerCase();
  
  if (!messageId) {
    console.log("[zapi-webhook] No messageId in status update");
    return;
  }

  console.log(`[zapi-webhook] Updating message ${messageId} status to ${status}`);

  const updateData: Record<string, unknown> = {
    status: mapZapiStatus(status),
    updated_at: new Date().toISOString(),
  };

  // Set timestamps based on status
  if (status === "delivered" || status === "received") {
    updateData.delivered_at = new Date().toISOString();
  } else if (status === "read" || status === "viewed") {
    updateData.read_at = new Date().toISOString();
  } else if (status === "failed" || status === "error") {
    updateData.error_message = data.status;
  }

  const { error } = await supabase
    .from("whatsapp_messages")
    .update(updateData)
    .eq("message_id", messageId);

  if (error) {
    console.error("[zapi-webhook] Error updating message status:", error);
  } else {
    console.log("[zapi-webhook] Message status updated successfully");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleReceivedMessage(supabase: any, data: ZapiReceivedMessage) {
  // Skip messages sent by us
  if (data.fromMe) {
    console.log("[zapi-webhook] Skipping outgoing message");
    return;
  }

  const phone = data.phone || data.chatId?.replace("@c.us", "");
  const message = data.text?.message || "";
  const messageId = data.zapiMessageId || data.messageId;

  if (!phone || !message) {
    console.log("[zapi-webhook] Missing phone or message in received message");
    return;
  }

  console.log(`[zapi-webhook] Received message from ${phone}: ${message.substring(0, 50)}...`);

  // Try to find associated contact by phone
  const normalizedPhone = normalizePhone(phone);
  const { data: contact } = await supabase
    .from("office_contacts")
    .select("id")
    .eq("telefone_norm", normalizedPhone)
    .limit(1)
    .single();

  // Insert received message
  const { error } = await supabase
    .from("whatsapp_messages")
    .insert({
      message_id: messageId,
      phone: phone,
      message: message,
      direction: "incoming",
      status: "received",
      contact_id: contact?.id || null,
      sent_at: new Date().toISOString(),
    });

  if (error) {
    console.error("[zapi-webhook] Error saving received message:", error);
  } else {
    console.log("[zapi-webhook] Received message saved successfully");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleConnectionStatus(supabase: any, data: ZapiConnectionStatus) {
  const isConnected = data.connected || data.status === "connected";
  console.log(`[zapi-webhook] Connection status: ${isConnected ? "connected" : "disconnected"}`);
  
  // Optionally update integrations_settings with connection status
  // For now, just log - can be extended later
}

function mapZapiStatus(status: string | undefined): string {
  if (!status) return "unknown";
  
  const statusMap: Record<string, string> = {
    "sent": "sent",
    "delivered": "delivered",
    "received": "delivered",
    "read": "read",
    "viewed": "read",
    "played": "read",
    "failed": "failed",
    "error": "failed",
    "pending": "pending",
  };
  
  return statusMap[status.toLowerCase()] || status.toLowerCase();
}

function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  let clean = phone.replace(/\D/g, "");
  
  // Add +55 if not present
  if (!clean.startsWith("55") && clean.length <= 11) {
    clean = "55" + clean;
  }
  
  return "+" + clean;
}
