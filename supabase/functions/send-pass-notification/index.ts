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

interface PassKitMember {
  id: string;
  externalId?: string;
  programId?: string;
  tierId?: string;
  points?: number | string;
  secondaryPoints?: number | string;
  metaData?: Record<string, unknown>;
  passOverrides?: Record<string, unknown>;
  [key: string]: unknown;
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
    
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const status = response.status;
    
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

/**
 * Resolve o membro no PassKit usando múltiplas estratégias:
 * 1) GET /members/member/{id} (se temos passkit_member_id local)
 * 2) GET /members/member/external/{programId}/{externalId}
 * 3) POST /members/member/list/{programId} com filtro por memberId/externalId
 */
async function resolveMember(
  leaderId: string,
  localMemberId: string | null,
  programId: string,
  apiToken: string,
  baseUrl: string
): Promise<{ member: PassKitMember | null; error?: string }> {
  
  // Estratégia 1: Tentar GET direto pelo passkit_member_id local
  if (localMemberId) {
    console.log(`[resolveMember] Tentativa 1: GET /members/member/${localMemberId}`);
    const directResult = await passkitRequest(
      "GET",
      `/members/member/${localMemberId}`,
      apiToken,
      baseUrl
    );
    
    if (directResult.status === 200 && directResult.data) {
      console.log(`[resolveMember] Encontrado via GET direto por ID`);
      return { member: directResult.data as PassKitMember };
    }
    console.log(`[resolveMember] GET direto retornou status ${directResult.status}`);
  }
  
  // Estratégia 2: GET /members/member/external/{programId}/{externalId}
  console.log(`[resolveMember] Tentativa 2: GET /members/member/external/${programId}/${leaderId}`);
  const externalResult = await passkitRequest(
    "GET",
    `/members/member/external/${programId}/${leaderId}`,
    apiToken,
    baseUrl
  );
  
  if (externalResult.status === 200 && externalResult.data) {
    console.log(`[resolveMember] Encontrado via GET external`);
    return { member: externalResult.data as PassKitMember };
  }
  console.log(`[resolveMember] GET external retornou status ${externalResult.status}`);
  
  // Estratégia 3: POST /members/member/list/{programId} com filtros
  console.log(`[resolveMember] Tentativa 3: POST /members/member/list/${programId} (filtro por memberId)`);
  const listResult = await passkitRequest(
    "POST",
    `/members/member/list/${programId}`,
    apiToken,
    baseUrl,
    {
      filters: {
        filterGroups: [
          {
            condition: "AND",
            fieldFilters: [
              {
                filterField: "memberId",
                filterValue: leaderId,
                filterOperator: "eq",
              },
            ],
          },
        ],
      },
      page: 0,
      pageSize: 10,
    }
  );
  
  if (listResult.status === 200 && listResult.data) {
    const listData = listResult.data as Record<string, unknown>;
    const results = listData?.results || listData?.result || listData?.data || listData?.members;
    const memberFromList = Array.isArray(results) ? results[0] : results;
    
    if (memberFromList?.id) {
      console.log(`[resolveMember] Encontrado via list por memberId: ${memberFromList.id}`);
      return { member: memberFromList as PassKitMember };
    }
  }
  
  // Estratégia 3b: tentar filtrar por externalId
  console.log(`[resolveMember] Tentativa 3b: POST /members/member/list/${programId} (filtro por externalId)`);
  const listByExternalResult = await passkitRequest(
    "POST",
    `/members/member/list/${programId}`,
    apiToken,
    baseUrl,
    {
      filters: {
        filterGroups: [
          {
            condition: "AND",
            fieldFilters: [
              {
                filterField: "externalId",
                filterValue: leaderId,
                filterOperator: "eq",
              },
            ],
          },
        ],
      },
      page: 0,
      pageSize: 10,
    }
  );
  
  if (listByExternalResult.status === 200 && listByExternalResult.data) {
    const listData = listByExternalResult.data as Record<string, unknown>;
    const results = listData?.results || listData?.result || listData?.data || listData?.members;
    const memberFromList = Array.isArray(results) ? results[0] : results;
    
    if (memberFromList?.id) {
      console.log(`[resolveMember] Encontrado via list por externalId: ${memberFromList.id}`);
      return { member: memberFromList as PassKitMember };
    }
  }
  
  console.log(`[resolveMember] Membro não encontrado por nenhuma estratégia`);
  return { member: null, error: "Membro não encontrado no PassKit após todas as tentativas" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { leaderId, leaderIds, message }: NotificationRequest = await req.json();

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedMessage = message.trim().substring(0, 150);
    
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

    if (!settings.passkit_api_token || !settings.passkit_program_id || !settings.passkit_tier_id) {
      return new Response(
        JSON.stringify({ error: "Configurações do PassKit incompletas (token, program_id ou tier_id)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passkitBaseUrl = settings.passkit_api_base_url || "https://api.pub1.passkit.io";
    console.log(`Usando PassKit API URL: ${passkitBaseUrl}`);

    const { data: leaders, error: leadersError } = await supabase
      .from("lideres")
      .select("id, nome_completo, telefone, email, pontuacao_total, cadastros, passkit_member_id, passkit_pass_installed")
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

    for (const leader of leaders) {
      try {
        console.log(`\n========== Processando: ${leader.nome_completo} (${leader.id}) ==========`);

        // Usar a função robusta de resolução de membro
        const { member, error: resolveError } = await resolveMember(
          leader.id,
          leader.passkit_member_id,
          settings.passkit_program_id!,
          settings.passkit_api_token!,
          passkitBaseUrl
        );

        if (!member || !member.id) {
          console.log(`Membro não encontrado para ${leader.nome_completo}: ${resolveError}`);
          // NÃO alterar passkit_pass_installed - webhook é a fonte da verdade
          results.push({
            success: false,
            leaderId: leader.id,
            leaderName: leader.nome_completo,
            error: resolveError || "Membro não encontrado no PassKit"
          });
          continue;
        }

        const memberId = member.id;
        console.log(`Membro resolvido: ${memberId}`);

        // Atualizar passkit_member_id no banco se diferente
        if (memberId !== leader.passkit_member_id) {
          console.log(`Atualizando passkit_member_id no banco: ${leader.passkit_member_id} -> ${memberId}`);
          await supabase
            .from("lideres")
            .update({ passkit_member_id: memberId })
            .eq("id", leader.id);
        }

        // Preparar dados para atualização
        const existingMetaData = (member.metaData as Record<string, unknown>) || {};
        const existingPassOverrides = (member.passOverrides as Record<string, unknown>) || {};
        const existingBackFields = (existingPassOverrides.backFields as Array<Record<string, string>>) || [];
        
        // Parse points corretamente (PassKit retorna como string às vezes)
        const currentPoints = parseFloat(String(member.points || leader.pontuacao_total || 0)) || 0;
        const currentSecondaryPoints = parseFloat(String(member.secondaryPoints || leader.cadastros || 0)) || 0;

        console.log(`Points atuais: ${currentPoints}, SecondaryPoints: ${currentSecondaryPoints}`);

        // Atualizar backFields com a mensagem
        const updatedBackFields = existingBackFields.filter(f => f.key !== "mensagem" && f.key !== "lastNotification");
        updatedBackFields.push({
          key: "lastNotification",
          label: "📢 Última Notificação",
          value: trimmedMessage
        });

        // Payload para PUT (mesmo padrão do create-leader-pass)
        const updateData = {
          id: memberId,
          programId: settings.passkit_program_id,
          tierId: settings.passkit_tier_id,
          // Incrementar secondaryPoints para disparar push notification
          points: currentPoints,
          secondaryPoints: currentSecondaryPoints + 1,
          metaData: {
            ...existingMetaData,
            lastMessage: trimmedMessage,
            lastMessageDate: now,
            notificationCount: (parseFloat(String(existingMetaData.notificationCount || 0)) || 0) + 1,
          },
          passOverrides: {
            ...existingPassOverrides,
            backFields: updatedBackFields
          }
        };

        console.log(`Atualizando membro via PUT /members/member...`);
        
        // Usar PUT como método principal (igual ao create-leader-pass)
        const updateResult = await passkitRequest(
          "PUT",
          "/members/member",
          settings.passkit_api_token!,
          passkitBaseUrl,
          updateData
        );

        if (updateResult.error) {
          console.error(`PUT falhou:`, updateResult.error);
          
          // Fallback para PATCH
          console.log(`Tentando PATCH /members/member/${memberId} como fallback...`);
          const patchResult = await passkitRequest(
            "PATCH",
            `/members/member/${memberId}`,
            settings.passkit_api_token!,
            passkitBaseUrl,
            updateData
          );
          
          if (patchResult.error) {
            console.error(`PATCH também falhou:`, patchResult.error);
            results.push({
              success: false,
              leaderId: leader.id,
              leaderName: leader.nome_completo,
              error: `PUT: ${updateResult.error}, PATCH: ${patchResult.error}`
            });
            continue;
          }
          
          console.log(`PATCH funcionou para ${leader.nome_completo}`);
        } else {
          console.log(`PUT funcionou para ${leader.nome_completo}`);
        }

        console.log(`✅ Notificação enviada com sucesso para ${leader.nome_completo}`);
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

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\n========== Resumo: ${successCount} sucesso, ${failCount} falha ==========`);

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
