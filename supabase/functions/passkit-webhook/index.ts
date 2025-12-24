import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PassKitWebhookPayload {
  eventType: string;
  id?: string;
  externalId?: string;
  programId?: string;
  tierId?: string;
  metadata?: {
    firstInstalledAt?: string;
    lastInstalledAt?: string;
    installDeviceAttributes?: {
      platform?: string;
      deviceType?: string;
    };
  };
  // Campos alternativos que podem vir do PassKit
  memberId?: string;
  member?: {
    id?: string;
    externalId?: string;
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

    const eventType = payload.eventType;
    
    // Extrair externalId e memberId de diferentes estruturas possíveis
    const externalId = payload.externalId || payload.member?.externalId;
    const memberId = payload.id || payload.memberId || payload.member?.id;

    console.log(`Evento: ${eventType}`);
    console.log(`ExternalId (leader_id): ${externalId}`);
    console.log(`MemberId: ${memberId}`);

    if (!externalId) {
      console.log("ExternalId não encontrado no payload, tentando buscar pelo memberId...");
      
      // Se não temos externalId mas temos memberId, podemos tentar buscar
      if (memberId) {
        // Buscar líder pelo passkit_member_id já salvo
        const { data: leader } = await supabase
          .from("lideres")
          .select("id")
          .eq("passkit_member_id", memberId)
          .single();

        if (leader) {
          console.log(`Líder encontrado pelo memberId: ${leader.id}`);
          await processEvent(supabase, eventType, leader.id, memberId, payload.metadata);
          
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

    await processEvent(supabase, eventType, externalId, memberId, payload.metadata);

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
  supabase: any,
  eventType: string,
  leaderId: string,
  memberId: string | undefined,
  metadata: PassKitWebhookPayload["metadata"]
) {
  console.log(`Processando evento ${eventType} para líder ${leaderId}`);

  switch (eventType) {
    case "PASS_EVENT_RECORD_CREATED":
    case "memberCreated":
      // Cartão criado no PassKit
      console.log("Cartão criado no PassKit");
      if (memberId) {
        const { error } = await supabase
          .from("lideres")
          .update({
            passkit_member_id: memberId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", leaderId);

        if (error) {
          console.error("Erro ao salvar passkit_member_id:", error);
          throw error;
        }
        console.log(`passkit_member_id ${memberId} salvo para líder ${leaderId}`);
      }
      break;

    case "PASS_EVENT_INSTALLED":
    case "passInstalled":
      // Cartão instalado na wallet
      console.log("Cartão instalado na wallet");
      const installedAt = metadata?.firstInstalledAt || metadata?.lastInstalledAt || new Date().toISOString();
      
      const updateDataInstalled: Record<string, any> = {
        passkit_pass_installed: true,
        passkit_installed_at: installedAt,
        passkit_uninstalled_at: null, // Limpar data de desinstalação
        updated_at: new Date().toISOString(),
      };
      
      if (memberId) {
        updateDataInstalled.passkit_member_id = memberId;
      }

      const { error: installError } = await supabase
        .from("lideres")
        .update(updateDataInstalled)
        .eq("id", leaderId);

      if (installError) {
        console.error("Erro ao marcar cartão como instalado:", installError);
        throw installError;
      }
      console.log(`Cartão marcado como instalado para líder ${leaderId}`);
      break;

    case "PASS_EVENT_UNINSTALLED":
    case "passUninstalled":
      // Cartão removido da wallet
      console.log("Cartão removido da wallet");
      const { error: uninstallError } = await supabase
        .from("lideres")
        .update({
          passkit_pass_installed: false,
          passkit_uninstalled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", leaderId);

      if (uninstallError) {
        console.error("Erro ao marcar cartão como desinstalado:", uninstallError);
        throw uninstallError;
      }
      console.log(`Cartão marcado como desinstalado para líder ${leaderId}`);
      break;

    case "PASS_EVENT_RECORD_UPDATED":
    case "memberUpdated":
      // Registro atualizado (pontuação, nível, etc)
      console.log("Registro atualizado no PassKit");
      // Apenas loga, não precisa fazer nada específico
      break;

    default:
      console.log(`Evento ${eventType} não tratado`);
  }
}
