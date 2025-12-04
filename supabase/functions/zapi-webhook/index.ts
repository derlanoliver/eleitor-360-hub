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
    .select("id, nome, is_verified, verification_code, source_id, source_type, pending_messages")
    .eq("telefone_norm", normalizedPhone)
    .limit(1)
    .single();

  // Check if message is a verification code (5 alphanumeric chars)
  const codeMatch = message.trim().toUpperCase().match(/^[A-Z0-9]{5}$/);
  
  if (codeMatch) {
    const code = codeMatch[0];
    console.log(`[zapi-webhook] Detected potential verification code: ${code}`);
    
    // Search for contact with this verification code
    const { data: contactToVerify, error: verifyError } = await supabase
      .from("office_contacts")
      .select("id, nome, source_id, source_type, is_verified, pending_messages, telefone_norm")
      .eq("verification_code", code)
      .eq("is_verified", false)
      .single();
    
    if (contactToVerify && !verifyError) {
      console.log(`[zapi-webhook] Found contact to verify: ${contactToVerify.id}`);
      
      // Mark as verified
      const { error: updateError } = await supabase
        .from("office_contacts")
        .update({ 
          is_verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq("id", contactToVerify.id);
      
      if (updateError) {
        console.error("[zapi-webhook] Error updating verification status:", updateError);
      } else {
        console.log(`[zapi-webhook] Contact ${contactToVerify.id} verified successfully`);
        
        // Send pending messages
        await sendPendingMessages(supabase, contactToVerify);
        
        // Send verification confirmation
        await sendVerificationConfirmation(supabase, contactToVerify.telefone_norm, contactToVerify.nome);
      }
    } else {
      console.log(`[zapi-webhook] No pending verification found for code: ${code}`);
    }
  }

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
async function sendPendingMessages(supabase: any, contact: any) {
  const pendingMessages = contact.pending_messages || [];
  
  if (pendingMessages.length === 0) {
    console.log("[zapi-webhook] No pending messages to send");
    return;
  }
  
  console.log(`[zapi-webhook] Sending ${pendingMessages.length} pending messages`);
  
  // Get integration settings for Z-API
  const { data: settings } = await supabase
    .from("integrations_settings")
    .select("zapi_instance_id, zapi_token, zapi_enabled")
    .limit(1)
    .single();
  
  if (!settings?.zapi_enabled || !settings?.zapi_instance_id || !settings?.zapi_token) {
    console.log("[zapi-webhook] Z-API not configured, skipping pending messages");
    return;
  }
  
  for (const pending of pendingMessages) {
    try {
      // Get template
      const { data: template } = await supabase
        .from("whatsapp_templates")
        .select("mensagem")
        .eq("slug", pending.template)
        .single();
      
      if (!template) {
        console.log(`[zapi-webhook] Template ${pending.template} not found`);
        continue;
      }
      
      // Replace variables
      let message = template.mensagem;
      for (const [key, value] of Object.entries(pending.variables || {})) {
        message = message.replace(new RegExp(`{{${key}}}`, "g"), value as string);
      }
      
      // Send via Z-API
      const zapiUrl = `https://api.z-api.io/instances/${settings.zapi_instance_id}/token/${settings.zapi_token}/send-text`;
      const response = await fetch(zapiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: contact.telefone_norm.replace("+", ""),
          message: message,
        }),
      });
      
      const result = await response.json();
      console.log(`[zapi-webhook] Sent pending message ${pending.template}:`, result);
      
      // Record in whatsapp_messages
      await supabase.from("whatsapp_messages").insert({
        message_id: result.messageId || result.zapiMessageId,
        phone: contact.telefone_norm,
        message: message,
        direction: "outgoing",
        status: "sent",
        contact_id: contact.id,
        sent_at: new Date().toISOString(),
      });
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      console.error(`[zapi-webhook] Error sending pending message:`, err);
    }
  }
  
  // Clear pending messages
  await supabase
    .from("office_contacts")
    .update({ pending_messages: [] })
    .eq("id", contact.id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendVerificationConfirmation(supabase: any, phone: string, nome: string) {
  // Get integration settings
  const { data: settings } = await supabase
    .from("integrations_settings")
    .select("zapi_instance_id, zapi_token, zapi_enabled")
    .limit(1)
    .single();
  
  if (!settings?.zapi_enabled) {
    console.log("[zapi-webhook] Z-API not enabled, skipping confirmation");
    return;
  }
  
  // Get organization name
  const { data: org } = await supabase
    .from("organization")
    .select("nome")
    .limit(1)
    .single();
  
  // Get confirmation template
  const { data: template } = await supabase
    .from("whatsapp_templates")
    .select("mensagem")
    .eq("slug", "verificacao-confirmada")
    .single();
  
  if (!template) {
    console.log("[zapi-webhook] Confirmation template not found");
    return;
  }
  
  // Replace variables
  let message = template.mensagem;
  message = message.replace(/{{nome}}/g, nome);
  message = message.replace(/{{deputado_nome}}/g, org?.nome || "Deputado");
  
  // Send via Z-API
  try {
    const zapiUrl = `https://api.z-api.io/instances/${settings.zapi_instance_id}/token/${settings.zapi_token}/send-text`;
    const response = await fetch(zapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.replace("+", ""),
        message: message,
      }),
    });
    
    const result = await response.json();
    console.log("[zapi-webhook] Sent verification confirmation:", result);
    
    // Record in whatsapp_messages
    const { data: contact } = await supabase
      .from("office_contacts")
      .select("id")
      .eq("telefone_norm", phone)
      .single();
    
    await supabase.from("whatsapp_messages").insert({
      message_id: result.messageId || result.zapiMessageId,
      phone: phone,
      message: message,
      direction: "outgoing",
      status: "sent",
      contact_id: contact?.id,
      sent_at: new Date().toISOString(),
    });
    
  } catch (err) {
    console.error("[zapi-webhook] Error sending confirmation:", err);
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