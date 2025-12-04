import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ZapiMessageStatus {
  zapiMessageId?: string;
  messageId?: string;
  ids?: string[];
  status?: string;
  type?: string;
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
  type?: string;
}

interface ZapiConnectionStatus {
  connected?: boolean;
  status?: string;
  error?: string;
  type?: string;
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
    console.log("[zapi-webhook] Detected webhook type:", webhookType, "| Z-API type:", body.type);

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
  // Use Z-API's 'type' field as primary source
  const zapiType = body.type as string | undefined;
  
  if (zapiType) {
    switch (zapiType) {
      case "MessageStatusCallback":
      case "DeliveryCallback":
      case "ReadCallback":
        return "message-status";
      case "ReceivedCallback":
        return "received-message";
      case "DisconnectedCallback":
      case "ConnectedCallback":
        return "connection-status";
    }
  }
  
  // Fallback to previous logic if no 'type' field
  if (body.status && (body.zapiMessageId || body.messageId || body.ids)) {
    return "message-status";
  }
  
  if (body.text || (body.phone && !body.status && !zapiType)) {
    return "received-message";
  }
  
  if (body.connected !== undefined) {
    return "connection-status";
  }
  
  return "unknown";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMessageStatus(supabase: any, data: ZapiMessageStatus) {
  // Extract messageId from multiple possible sources
  const messageId = data.zapiMessageId || data.messageId || 
    (Array.isArray(data.ids) && data.ids.length > 0 ? data.ids[0] : null);
  
  if (!messageId) {
    console.log("[zapi-webhook] No messageId in status update, data:", JSON.stringify(data));
    return;
  }

  // Determine status based on callback type and status field
  let status = data.status?.toLowerCase();
  const zapiType = data.type;
  
  // If DeliveryCallback without explicit status, it's "delivered"
  if (zapiType === "DeliveryCallback" && !status) {
    status = "delivered";
  }
  // If ReadCallback without explicit status, it's "read"
  if (zapiType === "ReadCallback" && !status) {
    status = "read";
  }
  // Map common Z-API statuses
  if (status === "received") {
    status = "delivered";
  }

  console.log(`[zapi-webhook] Updating message ${messageId} status to ${status} (type: ${zapiType})`);

  const updateData: Record<string, unknown> = {
    status: mapZapiStatus(status),
    updated_at: new Date().toISOString(),
  };

  // Set timestamps based on status
  const mappedStatus = mapZapiStatus(status);
  if (mappedStatus === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  } else if (mappedStatus === "read") {
    updateData.read_at = new Date().toISOString();
    // Also set delivered_at if not already set
    updateData.delivered_at = new Date().toISOString();
  } else if (mappedStatus === "failed") {
    updateData.error_message = data.status || "Failed";
  }

  const { error, count } = await supabase
    .from("whatsapp_messages")
    .update(updateData)
    .eq("message_id", messageId);

  if (error) {
    console.error("[zapi-webhook] Error updating message status:", error);
  } else {
    console.log(`[zapi-webhook] Message status updated successfully (matched: ${count})`);
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
  const isConnected = data.connected || data.status === "connected" || data.type === "ConnectedCallback";
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
    "read_by_me": "read",
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
