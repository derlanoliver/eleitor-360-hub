import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Estrutura real do payload do PassKit baseada nos logs
interface PassKitWebhookPayload {
  event: string; // Ex: "PASS_EVENT_RECORD_UPDATED", "PASS_EVENT_RECORD_CREATED"
  pass: {
    id: string; // PassKit member ID
    externalId: string; // leader_id
    classId?: string;
    personDetails?: {
      prefix?: string;
      forename?: string;
      surname?: string;
      displayName?: string;
    };
    metadata?: {
      firstInstalledAt?: string;
      lastInstalledAt?: string;
      firstUninstalledAt?: string;
      lastUninstalledAt?: string;
      installCount?: number;
      installDeviceAttributes?: {
        platform?: string;
        deviceType?: string;
      };
    };
    recordData?: Record<string, string>;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== PassKit Webhook Received ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse o payload recebido
    const payload: PassKitWebhookPayload = await req.json();
    console.log("Payload recebido:", JSON.stringify(payload, null, 2));

    // Extrair dados da estrutura real do PassKit
    const eventType = payload.event;
    const passData = payload.pass;
    
    if (!passData) {
      console.log("Payload sem dados de pass");
      return new Response(
        JSON.stringify({ success: false, error: "Payload inválido - sem dados de pass" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const externalId = passData.externalId; // leader_id
    const memberId = passData.id; // PassKit member ID
    const metadata = passData.metadata;
    const recordData = passData.recordData || {};
    
    // Verificar status de instalação no recordData
    const universalStatus = recordData["universal.status"];

    console.log(`Evento: ${eventType}`);
    console.log(`ExternalId (leader_id): ${externalId}`);
    console.log(`MemberId: ${memberId}`);
    console.log(`Universal Status: ${universalStatus}`);
    console.log(`Metadata:`, JSON.stringify(metadata, null, 2));

    if (!externalId) {
      console.log("ExternalId não encontrado no payload, tentando buscar pelo memberId...");
      
      if (memberId) {
        const { data: leader } = await supabase
          .from("lideres")
          .select("id")
          .eq("passkit_member_id", memberId)
          .single();

        if (leader) {
          console.log(`Líder encontrado pelo memberId: ${leader.id}`);
          await processEvent(supabase, eventType, leader.id, memberId, metadata, universalStatus);
          
          return new Response(
            JSON.stringify({ success: true, message: "Evento processado via memberId" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      console.log("Não foi possível identificar o líder");
      return new Response(
        JSON.stringify({ success: false, error: "ExternalId não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await processEvent(supabase, eventType, externalId, memberId, metadata, universalStatus);

    return new Response(
      JSON.stringify({ success: true, message: `Evento ${eventType} processado` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventType: string,
  leaderId: string,
  memberId: string | undefined,
  metadata: PassKitWebhookPayload["pass"]["metadata"],
  universalStatus: string | undefined
) {
  console.log(`Processando evento ${eventType} para líder ${leaderId}`);
  console.log(`Status universal: ${universalStatus}`);

  // Sempre salvar o memberId se disponível
  const baseUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (memberId) {
    baseUpdate.passkit_member_id = memberId;
  }

  // Processar baseado no status de instalação (mais confiável que o tipo de evento)
  if (universalStatus === "PASS_INSTALLED") {
    console.log("Cartão INSTALADO na wallet");
    const installedAt = metadata?.firstInstalledAt || metadata?.lastInstalledAt || new Date().toISOString();
    
    const { error } = await supabase
      .from("lideres")
      .update({
        ...baseUpdate,
        passkit_pass_installed: true,
        passkit_installed_at: installedAt,
        passkit_uninstalled_at: null,
      })
      .eq("id", leaderId);

    if (error) {
      console.error("Erro ao marcar cartão como instalado:", error);
      throw error;
    }
    console.log(`Cartão marcado como INSTALADO para líder ${leaderId}`);
    return;
  }

  if (universalStatus === "PASS_UNINSTALLED") {
    console.log("Cartão DESINSTALADO da wallet");
    const uninstalledAt = metadata?.lastUninstalledAt || new Date().toISOString();
    
    const { error } = await supabase
      .from("lideres")
      .update({
        ...baseUpdate,
        passkit_pass_installed: false,
        passkit_uninstalled_at: uninstalledAt,
      })
      .eq("id", leaderId);

    if (error) {
      console.error("Erro ao marcar cartão como desinstalado:", error);
      throw error;
    }
    console.log(`Cartão marcado como DESINSTALADO para líder ${leaderId}`);
    return;
  }

  // Fallback: processar pelo tipo de evento se não tiver universalStatus
  switch (eventType) {
    case "PASS_EVENT_RECORD_CREATED":
      console.log("Registro criado no PassKit");
      if (memberId) {
        const { error } = await supabase
          .from("lideres")
          .update(baseUpdate)
          .eq("id", leaderId);

        if (error) {
          console.error("Erro ao salvar passkit_member_id:", error);
          throw error;
        }
        console.log(`passkit_member_id ${memberId} salvo para líder ${leaderId}`);
      }
      break;

    case "PASS_EVENT_RECORD_UPDATED":
      console.log("Registro atualizado no PassKit (sem mudança de status)");
      // Salvar memberId se ainda não tiver
      if (memberId) {
        const { error } = await supabase
          .from("lideres")
          .update(baseUpdate)
          .eq("id", leaderId);

        if (error) {
          console.error("Erro ao atualizar registro:", error);
        }
      }
      break;

    default:
      console.log(`Evento ${eventType} não tratado especificamente`);
  }
}
