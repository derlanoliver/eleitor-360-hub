import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSMSRequest {
  phone: string;
  message?: string;
  templateSlug?: string;
  variables?: Record<string, string>;
  contactId?: string;
}

function replaceTemplateVariables(message: string, variables: Record<string, string>): string {
  let result = message;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  return result;
}

function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  let clean = phone.replace(/\D/g, "");
  
  // Remove country code if present
  if (clean.startsWith("55") && clean.length > 11) {
    clean = clean.substring(2);
  }
  
  // If 10 digits and starts with DF area code, add 9
  if (clean.length === 10 && clean.startsWith("61")) {
    clean = "61" + "9" + clean.substring(2);
  }
  
  return clean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone, message, templateSlug, variables, contactId }: SendSMSRequest = await req.json();

    console.log("[send-sms] Request received:", { phone, templateSlug, hasMessage: !!message });

    // Validate required fields
    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message && !templateSlug) {
      return new Response(
        JSON.stringify({ success: false, error: "Message or templateSlug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMSDEV settings
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("smsdev_api_key, smsdev_enabled")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error("[send-sms] Settings error:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Configurações SMSDEV não encontradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.smsdev_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: "Integração SMSDEV não está habilitada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.smsdev_api_key) {
      return new Response(
        JSON.stringify({ success: false, error: "API Key SMSDEV não configurada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get message content
    let finalMessage = message || "";

    if (templateSlug) {
      const { data: template, error: templateError } = await supabase
        .from("sms_templates")
        .select("*")
        .eq("slug", templateSlug)
        .eq("is_active", true)
        .single();

      if (templateError || !template) {
        console.error("[send-sms] Template error:", templateError);
        return new Response(
          JSON.stringify({ success: false, error: `Template '${templateSlug}' não encontrado` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      finalMessage = replaceTemplateVariables(template.mensagem, variables || {});
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);
    console.log("[send-sms] Normalized phone:", normalizedPhone);

    // Create message record with pending status
    const { data: messageRecord, error: insertError } = await supabase
      .from("sms_messages")
      .insert({
        phone: normalizedPhone,
        message: finalMessage,
        direction: "outgoing",
        status: "pending",
        contact_id: contactId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[send-sms] Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao registrar mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via SMSDEV API
    const encodedMessage = encodeURIComponent(finalMessage);
    const smsdevUrl = `https://api.smsdev.com.br/v1/send?key=${settings.smsdev_api_key}&type=9&number=${normalizedPhone}&msg=${encodedMessage}`;

    console.log("[send-sms] Sending to SMSDEV...");
    
    const smsResponse = await fetch(smsdevUrl);
    const smsResult = await smsResponse.json();
    
    console.log("[send-sms] SMSDEV response:", smsResult);

    // Update message record based on response
    if (smsResult.situacao === "OK") {
      await supabase
        .from("sms_messages")
        .update({
          message_id: smsResult.id,
          status: "queued",
          sent_at: new Date().toISOString(),
        })
        .eq("id", messageRecord.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: messageRecord.id,
            smsdevId: smsResult.id,
            status: "queued",
            description: smsResult.descricao,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Update with error
      await supabase
        .from("sms_messages")
        .update({
          status: "failed",
          error_message: smsResult.descricao || "Erro desconhecido",
        })
        .eq("id", messageRecord.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: smsResult.descricao || "Erro ao enviar SMS",
          code: smsResult.codigo,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("[send-sms] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
