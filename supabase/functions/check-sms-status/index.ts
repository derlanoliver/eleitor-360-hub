import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SMSDEV status codes mapping (same as webhook)
const STATUS_MAP: Record<string, string> = {
  "0": "queued",
  "1": "sent",
  "2": "delivered",
  "3": "failed",
  "4": "failed",
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

interface SMSMessage {
  id: string;
  message_id: string;
  phone: string;
  status: string;
}

interface SMSDEVStatusResponse {
  situacao?: string;
  status?: string;
  descricao?: string;
  codigo?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[check-sms-status] Starting SMS status check...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get SMSDEV API key from integrations_settings
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("smsdev_api_key, smsdev_enabled")
      .limit(1)
      .single();

    if (settingsError || !settings?.smsdev_enabled || !settings?.smsdev_api_key) {
      console.log("[check-sms-status] SMSDEV not enabled or API key not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SMSDEV not enabled or API key not configured" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get messages with pending status (queued or sent) that have a message_id
    const { data: pendingMessages, error: messagesError } = await supabase
      .from("sms_messages")
      .select("id, message_id, phone, status")
      .in("status", ["queued", "sent"])
      .not("message_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (messagesError) {
      console.error("[check-sms-status] Error fetching pending messages:", messagesError);
      throw messagesError;
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log("[check-sms-status] No pending messages to check");
      return new Response(
        JSON.stringify({ success: true, checked: 0, updated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[check-sms-status] Found ${pendingMessages.length} pending messages to check`);

    let checkedCount = 0;
    let updatedCount = 0;
    const apiKey = settings.smsdev_api_key;

    // 3. For each message, query SMSDEV API for current status
    for (const msg of pendingMessages) {
      try {
        // SMSDEV API endpoint for status check
        // According to SMSDEV docs: GET https://api.smsdev.com.br/v1/dlr?key=API_KEY&id=MESSAGE_ID
        const statusUrl = `https://api.smsdev.com.br/v1/dlr?key=${apiKey}&id=${msg.message_id}`;
        
        console.log(`[check-sms-status] Checking status for message ${msg.message_id}`);
        
        const response = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });

        checkedCount++;

        if (!response.ok) {
          console.log(`[check-sms-status] API error for message ${msg.message_id}: ${response.status}`);
          continue;
        }

        const statusData: SMSDEVStatusResponse = await response.json();
        console.log(`[check-sms-status] Status response for ${msg.message_id}:`, JSON.stringify(statusData));

        // Extract status from response
        const rawStatus = statusData.situacao || statusData.status || statusData.codigo;
        
        if (!rawStatus) {
          console.log(`[check-sms-status] No status in response for message ${msg.message_id}`);
          continue;
        }

        // Map to our internal status
        const normalizedStatus = rawStatus.toString().toUpperCase();
        const mappedStatus = STATUS_MAP[normalizedStatus] || STATUS_MAP[rawStatus];
        
        if (!mappedStatus) {
          console.log(`[check-sms-status] Unknown status ${rawStatus} for message ${msg.message_id}`);
          continue;
        }

        // Only update if status changed
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
        console.log(`[check-sms-status] Successfully updated message ${msg.message_id} to ${mappedStatus}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (msgError) {
        console.error(`[check-sms-status] Error processing message ${msg.message_id}:`, msgError);
        continue;
      }
    }

    console.log(`[check-sms-status] Completed. Checked: ${checkedCount}, Updated: ${updatedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: checkedCount, 
        updated: updatedCount 
      }),
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
