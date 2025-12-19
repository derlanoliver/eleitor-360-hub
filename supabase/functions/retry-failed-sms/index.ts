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

    // Get SMSDEV settings
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("smsdev_api_key, smsdev_enabled")
      .limit(1)
      .single();

    if (settingsError || !settings?.smsdev_enabled || !settings?.smsdev_api_key) {
      console.log("[retry-failed-sms] SMSDEV not configured or disabled");
      return new Response(
        JSON.stringify({ success: false, error: "SMSDEV não configurado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          // Failed again - the trigger will update next_retry_at and retry_history
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
    console.log(`[retry-failed-sms] Completed in ${duration}ms. Success: ${results.success}, Failed: ${results.failed}`);

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
