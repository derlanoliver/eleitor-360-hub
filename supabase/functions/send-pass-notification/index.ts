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
  baseUrl: string,
  body?: unknown
): Promise<{ data?: unknown; error?: string; status: number }> {
  try {
    const url = `${baseUrl}${path}`;
    
    console.log(`PassKit ${method} request to: ${url}`);
    if (body) {
      console.log(`Request payload:`, JSON.stringify(body, null, 2));
    }
    
    const options: RequestInit = {
      method,
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    };
    
    // PATCH, PUT e POST podem ter body
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const status = response.status;
    
    // Log headers for debugging
    console.log(`Response status: ${status}`);
    
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
      .select("passkit_enabled, passkit_api_token, passkit_program_id, passkit_tier_id, passkit_api_base_url")
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

    // Usar URL base configurada ou fallback para pub1
    const passkitBaseUrl = settings.passkit_api_base_url || "https://api.pub1.passkit.io";
    console.log(`Usando PassKit API URL: ${passkitBaseUrl}`);

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
            passkitBaseUrl,
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

        // Buscar dados atuais do membro no PassKit usando externalId (mais confiável)
        // O endpoint /members/member/external/{programId}/{externalId} é o mais estável
        console.log(`Buscando membro pelo externalId (leader.id): ${leader.id}`);
        let getCurrentMemberResult = await passkitRequest(
          "GET",
          `/members/member/external/${settings.passkit_program_id}/${leader.id}`,
          settings.passkit_api_token,
          passkitBaseUrl
        );

        // Se encontrou, extrair o memberId real e atualizar no banco se necessário
        if (getCurrentMemberResult.status === 200 && getCurrentMemberResult.data) {
          const foundMember = getCurrentMemberResult.data as Record<string, unknown>;
          const realMemberId = foundMember.id as string;
          
          if (realMemberId && realMemberId !== memberId) {
            console.log(`MemberId atualizado: ${memberId} -> ${realMemberId}`);
            memberId = realMemberId;
            
            // Atualizar o passkit_member_id no banco (sem alterar passkit_pass_installed)
            await supabase
              .from("lideres")
              .update({ passkit_member_id: memberId })
              .eq("id", leader.id);
          }
        } else if (getCurrentMemberResult.status === 404) {
          console.log(`Membro não encontrado pelo externalId ${leader.id} (404)`);
          
          // NÃO alterar passkit_pass_installed - a fonte da verdade é o webhook
          // Apenas limpar o passkit_member_id inválido
          await supabase
            .from("lideres")
            .update({ passkit_member_id: null })
            .eq("id", leader.id);
            
          results.push({
            success: false,
            leaderId: leader.id,
            leaderName: leader.nome_completo,
            error: "Membro não encontrado no PassKit. O cartão pode ter sido desinstalado."
          });
          continue;
        }

        if (getCurrentMemberResult.error || !getCurrentMemberResult.data) {
          console.error(`Erro ao buscar dados do membro ${memberId}:`, getCurrentMemberResult.error);
          results.push({
            success: false,
            leaderId: leader.id,
            leaderName: leader.nome_completo,
            error: `Erro ao buscar membro: ${getCurrentMemberResult.error}`
          });
          continue;
        }

        const currentMember = getCurrentMemberResult.data as Record<string, unknown>;
        console.log(`Dados atuais do membro:`, JSON.stringify(currentMember, null, 2));
        
        // Extrair dados existentes
        const existingMetaData = (currentMember.metaData as Record<string, unknown>) || {};
        const existingPassOverrides = (currentMember.passOverrides as Record<string, unknown>) || {};
        const existingBackFields = (existingPassOverrides.backFields as Array<Record<string, string>>) || [];
        
        // Pegar pontos atuais para incrementar (isso dispara o push se o campo tiver changeMessage)
        const currentPoints = (currentMember.points as number) || (leader.pontuacao_total || 0);
        const currentSecondaryPoints = (currentMember.secondaryPoints as number) || 0;

        // Atualizar ou adicionar campo de mensagem nos backFields
        const updatedBackFields = existingBackFields.filter(f => f.key !== "mensagem" && f.key !== "lastNotification");
        updatedBackFields.push({
          key: "lastNotification",
          label: "📢 Última Notificação",
          value: trimmedMessage
        });

        // Payload para atualização via PATCH - usar o ID na URL
        // Incrementar secondaryPoints ou points para disparar push notification
        // O campo com changeMessage configurado no template será notificado
        const updateData = {
          id: memberId,
          programId: settings.passkit_program_id,
          tierId: settings.passkit_tier_id,
          // Incrementar pontos para tentar disparar push (se changeMessage estiver configurado)
          points: currentPoints,
          secondaryPoints: currentSecondaryPoints + 1, // Incrementa para disparar notificação
          metaData: {
            ...existingMetaData,
            lastMessage: trimmedMessage,
            lastMessageDate: now,
            notificationCount: ((existingMetaData.notificationCount as number) || 0) + 1,
          },
          passOverrides: {
            ...existingPassOverrides,
            backFields: updatedBackFields
          }
        };

        console.log(`Atualizando membro ${memberId} via PATCH...`);
        
        // Usar PATCH com o ID do membro na URL
        const updateResult = await passkitRequest(
          "PATCH",
          `/members/member/${memberId}`,
          settings.passkit_api_token,
          passkitBaseUrl,
          updateData
        );

        if (updateResult.error) {
          console.error(`Erro ao atualizar membro ${leader.id} via PATCH:`, updateResult.error);
          
          // Tentar com PUT como fallback
          console.log(`Tentando com PUT /members/member como fallback...`);
          const putResult = await passkitRequest(
            "PUT",
            "/members/member",
            settings.passkit_api_token,
            passkitBaseUrl,
            updateData
          );
          
          if (putResult.error) {
            console.error(`PUT também falhou:`, putResult.error);
            results.push({
              success: false,
              leaderId: leader.id,
              leaderName: leader.nome_completo,
              error: `PATCH: ${updateResult.error}, PUT: ${putResult.error}`
            });
            continue;
          }
          
          console.log(`PUT funcionou para ${leader.nome_completo}`);
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
