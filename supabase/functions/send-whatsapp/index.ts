import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendWhatsAppRequest {
  phone: string;
  message?: string;
  templateSlug?: string;
  variables?: Record<string, string>;
  visitId?: string;
  contactId?: string;
  imageUrl?: string; // URL da imagem a ser enviada após a mensagem de texto
}

// Replace template variables {{var}} with actual values
function replaceTemplateVariables(
  mensagem: string,
  variables: Record<string, string>
): string {
  let result = mensagem;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

// Templates públicos que podem ser enviados sem autenticação
const PUBLIC_TEMPLATES = [
  'evento-inscricao-confirmada',
  'captacao-boas-vindas',
  'lider-cadastro-confirmado',
  'visita-link-formulario',
  'verificacao-cadastro',
  'verificacao-codigo',
  'membro-cadastro-boas-vindas',
  'lideranca-cadastro-link',
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body first to check if it's a public template
    const requestBody: SendWhatsAppRequest = await req.json();
    const { phone, message, templateSlug, variables, visitId, contactId, imageUrl } = requestBody;

    // DEBUG: Log request details
    console.log(`[send-whatsapp] REQUEST RECEIVED - templateSlug: ${templateSlug}, phone: ${phone?.substring(0, 6)}...`);
    console.log(`[send-whatsapp] PUBLIC_TEMPLATES list:`, PUBLIC_TEMPLATES);

    const isPublicTemplate = templateSlug && PUBLIC_TEMPLATES.includes(templateSlug);
    console.log(`[send-whatsapp] isPublicTemplate: ${isPublicTemplate} (templateSlug: ${templateSlug})`);

    // ============ AUTHENTICATION CHECK (skip for public templates) ============
    if (!isPublicTemplate) {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        console.error("[send-whatsapp] Missing authorization header");
        return new Response(
          JSON.stringify({ success: false, error: "Não autenticado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.error("[send-whatsapp] Invalid token:", authError);
        return new Response(
          JSON.stringify({ success: false, error: "Token inválido" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check user has admin, super_admin, or atendente role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin", "atendente"])
        .limit(1)
        .single();

      if (roleError || !roleData) {
        console.error("[send-whatsapp] User lacks required role:", user.id);
        return new Response(
          JSON.stringify({ success: false, error: "Acesso não autorizado. Requer permissão de admin ou atendente." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[send-whatsapp] Authenticated user: ${user.email} with role: ${roleData.role}`);
    } else {
      console.log(`[send-whatsapp] Public template '${templateSlug}' - skipping authentication`);
    }
    // ============ END AUTHENTICATION CHECK ============

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

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Telefone é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let finalMessage = message;

    // If templateSlug is provided, fetch template and process variables
    if (templateSlug) {
      console.log(`[send-whatsapp] Buscando template: ${templateSlug}`);
      
      const { data: template, error: templateError } = await supabase
        .from("whatsapp_templates")
        .select("mensagem, is_active")
        .eq("slug", templateSlug)
        .single();

      if (templateError || !template) {
        console.error("[send-whatsapp] Template não encontrado:", templateError);
        return new Response(
          JSON.stringify({ success: false, error: `Template '${templateSlug}' não encontrado` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!template.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: "Template está inativo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      finalMessage = variables 
        ? replaceTemplateVariables(template.mensagem, variables)
        : template.mensagem;
    }

    if (!finalMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "Mensagem é obrigatória (via message ou templateSlug)" }),
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
        message: finalMessage,
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
        message: finalMessage,
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

    // Se tiver imageUrl, enviar imagem após a mensagem de texto
    if (imageUrl && zapiResponse.ok) {
      console.log(`[send-whatsapp] Enviando imagem para ${cleanPhone}: ${imageUrl}`);
      
      // Aguardar 2 segundos antes de enviar a imagem
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const zapiImageUrl = `https://api.z-api.io/instances/${settings.zapi_instance_id}/token/${settings.zapi_token}/send-image`;
      
      try {
        const imageResponse = await fetch(zapiImageUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(settings.zapi_client_token && { "Client-Token": settings.zapi_client_token }),
          },
          body: JSON.stringify({
            phone: cleanPhone,
            image: imageUrl,
          }),
        });
        
        const imageData = await imageResponse.json();
        console.log(`[send-whatsapp] Resposta Z-API (imagem):`, imageData);
        
        if (!imageResponse.ok) {
          console.error("[send-whatsapp] Erro ao enviar imagem:", imageData);
        }
      } catch (imageError) {
        console.error("[send-whatsapp] Erro ao enviar imagem:", imageError);
      }
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
      JSON.stringify({ success: false, error: (error as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
