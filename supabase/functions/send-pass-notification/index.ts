import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  leaderId?: string;
  leaderIds?: string[];
  message: string;
}

interface PassKitResponse {
  success: boolean;
  leaderId: string;
  leaderName: string;
  error?: string;
}

async function passkitRequest(
  method: string,
  path: string,
  apiToken: string,
  body?: unknown
): Promise<{ data?: unknown; error?: string; status: number }> {
  try {
    const baseUrl = "https://api.pub1.passkit.io";
    const url = `${baseUrl}${path}`;
    
    console.log(`PassKit ${method} request to: ${url}`);
    
    const options: RequestInit = {
      method,
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    };
    
    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const status = response.status;
    
    let data: unknown = null;
    const text = await response.text();
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    
    if (!response.ok) {
      console.error(`PassKit error (${status}):`, data);
      return { error: typeof data === "string" ? data : JSON.stringify(data), status };
    }
    
    return { data, status };
  } catch (error: unknown) {
    console.error("PassKit request error:", error);
    return { error: error instanceof Error ? error.message : String(error), status: 500 };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { leaderId, leaderIds, message }: NotificationRequest = await req.json();

    // Validar input
    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedMessage = message.trim().substring(0, 150);
    
    // Determinar IDs a processar
    let idsToProcess: string[] = [];
    if (leaderId) {
      idsToProcess = [leaderId];
    } else if (leaderIds && leaderIds.length > 0) {
      idsToProcess = leaderIds;
    } else {
      return new Response(
        JSON.stringify({ error: "É necessário fornecer leaderId ou leaderIds" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Enviando notificação para ${idsToProcess.length} líder(es)`);

    // Buscar configurações do PassKit
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("passkit_enabled, passkit_api_token, passkit_program_id, passkit_tier_id")
      .single();

    if (settingsError || !settings) {
      console.error("Erro ao buscar configurações:", settingsError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar configurações de integração" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.passkit_enabled) {
      return new Response(
        JSON.stringify({ error: "Integração PassKit não está habilitada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.passkit_api_token || !settings.passkit_program_id) {
      return new Response(
        JSON.stringify({ error: "Configurações do PassKit incompletas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar líderes com campos de PassKit
    const { data: leaders, error: leadersError } = await supabase
      .from("lideres")
      .select("id, nome_completo, telefone, email, pontuacao_total, passkit_member_id, passkit_pass_installed")
      .in("id", idsToProcess)
      .eq("is_active", true);

    if (leadersError) {
      console.error("Erro ao buscar líderes:", leadersError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar líderes" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!leaders || leaders.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum líder ativo encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: PassKitResponse[] = [];
    const now = new Date().toISOString();

    // Processar cada líder
    for (const leader of leaders) {
      try {
        console.log(`Processando líder: ${leader.nome_completo} (${leader.id})`);

        let memberId = leader.passkit_member_id;

        // Se temos o passkit_member_id salvo, usar diretamente
        if (memberId) {
          console.log(`Usando passkit_member_id local: ${memberId}`);
        } else {
          // Buscar membro no PassKit pelo externalId
          console.log(`passkit_member_id não encontrado, buscando no PassKit com externalId: ${leader.id}`);
          
          const getMemberResult = await passkitRequest(
            "POST",
            "/members/member/find",
            settings.passkit_api_token,
            {
              programId: settings.passkit_program_id,
              externalId: leader.id
            }
          );

          console.log(`Resposta da busca:`, JSON.stringify(getMemberResult));

          if (getMemberResult.status === 404 || !getMemberResult.data) {
            console.log(`Líder ${leader.nome_completo} não tem cartão no PassKit (status: ${getMemberResult.status})`);
            results.push({
              success: false,
              leaderId: leader.id,
              leaderName: leader.nome_completo,
              error: "Líder não possui cartão no PassKit"
            });
            continue;
          }

          if (getMemberResult.error) {
            console.error(`Erro ao buscar membro ${leader.id}:`, getMemberResult.error);
            results.push({
              success: false,
              leaderId: leader.id,
              leaderName: leader.nome_completo,
              error: getMemberResult.error
            });
            continue;
          }

          const existingMember = getMemberResult.data as Record<string, unknown>;
          memberId = existingMember.id as string;
          console.log(`Membro encontrado no PassKit: ${memberId}`);

          // Salvar o passkit_member_id para futuras consultas
          if (memberId) {
            console.log(`Salvando passkit_member_id: ${memberId}`);
            await supabase
              .from("lideres")
              .update({ passkit_member_id: memberId })
              .eq("id", leader.id);
          }
        }

        if (!memberId) {
          results.push({
            success: false,
            leaderId: leader.id,
            leaderName: leader.nome_completo,
            error: "Não foi possível obter o ID do membro no PassKit"
          });
          continue;
        }

        // Buscar dados atuais do membro no PassKit para preservar campos existentes
        console.log(`Buscando dados atuais do membro ${memberId} para preservar campos...`);
        const getCurrentMemberResult = await passkitRequest(
          "GET",
          `/members/member/${memberId}`,
          settings.passkit_api_token
        );

        let existingMetaData: Record<string, unknown> = {};
        let existingPassOverrides: Record<string, unknown> = {};
        let existingBackFields: Array<Record<string, string>> = [];

        if (getCurrentMemberResult.data) {
          const currentMember = getCurrentMemberResult.data as Record<string, unknown>;
          existingMetaData = (currentMember.metaData as Record<string, unknown>) || {};
          existingPassOverrides = (currentMember.passOverrides as Record<string, unknown>) || {};
          existingBackFields = (existingPassOverrides.backFields as Array<Record<string, string>>) || [];
        }

        // Atualizar ou adicionar campo de mensagem nos backFields
        const updatedBackFields = existingBackFields.filter(f => f.key !== "mensagem");
        updatedBackFields.push({
          key: "mensagem",
          label: "📢 Última Notificação",
          value: trimmedMessage
        });

        const updateData = {
          id: memberId,
          programId: settings.passkit_program_id,
          tierId: settings.passkit_tier_id,
          metaData: {
            ...existingMetaData,
            lastMessage: trimmedMessage,
            lastMessageDate: now,
          },
          passOverrides: {
            ...existingPassOverrides,
            backFields: updatedBackFields
          }
        };

        console.log(`Atualizando membro com notificação...`);
        
        const updateResult = await passkitRequest(
          "PUT",
          "/members/member",
          settings.passkit_api_token,
          updateData
        );

        if (updateResult.error) {
          console.error(`Erro ao atualizar membro ${leader.id}:`, updateResult.error);
          results.push({
            success: false,
            leaderId: leader.id,
            leaderName: leader.nome_completo,
            error: updateResult.error
          });
          continue;
        }

        console.log(`Notificação enviada com sucesso para ${leader.nome_completo}`);
        results.push({
          success: true,
          leaderId: leader.id,
          leaderName: leader.nome_completo
        });

      } catch (error: unknown) {
        console.error(`Erro ao processar líder ${leader.id}:`, error);
        results.push({
          success: false,
          leaderId: leader.id,
          leaderName: leader.nome_completo,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Resumo
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Processamento concluído: ${successCount} sucesso, ${failCount} falha`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount
        },
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
