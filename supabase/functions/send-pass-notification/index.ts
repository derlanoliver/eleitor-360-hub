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
 * Verifica se um membro está invalidado baseado em seu status
 */
function isMemberInvalidated(member: Record<string, unknown>): boolean {
  const status = member.universalStatus || 
                 member.status || 
                 (member.recordData as Record<string, unknown>)?.["universal.status"];
  return status === "PASS_INVALIDATED" || status === "3" || status === 3;
}

/**
 * Resolve o membro no PassKit usando múltiplas estratégias:
 * 1) GET /members/member/{id} (se temos passkit_member_id local)
 * 2) GET /members/member/external/{programId}/{externalId}
 * 3) POST /members/member/list/{programId} com filtro por memberId
 * 4) POST /members/member/list/{programId} com filtro por email (se disponível)
 * 5) POST /members/member/list/{programId} sem filtros + filtro local por externalId
 * 
 * IMPORTANTE: Ignora membros invalidados e continua buscando alternativas válidas
 * NOTA: A API do PassKit NÃO suporta filtrar por externalId - usamos filtro local
 */
async function resolveMember(
  leaderId: string,
  localMemberId: string | null,
  programId: string,
  apiToken: string,
  baseUrl: string,
  leaderEmail?: string | null
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
      const member = directResult.data as Record<string, unknown>;
      // Verificar se está invalidado
      if (isMemberInvalidated(member)) {
        console.log(`[resolveMember] Membro ${localMemberId} encontrado mas está INVALIDADO - continuando busca`);
      } else {
        console.log(`[resolveMember] Encontrado via GET direto por ID (válido)`);
        return { member: member as PassKitMember };
      }
    } else {
      console.log(`[resolveMember] GET direto retornou status ${directResult.status}`);
    }
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
    const member = externalResult.data as Record<string, unknown>;
    if (isMemberInvalidated(member)) {
      console.log(`[resolveMember] Membro encontrado via external mas está INVALIDADO - continuando busca`);
    } else {
      console.log(`[resolveMember] Encontrado via GET external (válido)`);
      return { member: member as PassKitMember };
    }
  } else {
    console.log(`[resolveMember] GET external retornou status ${externalResult.status}`);
  }
  
  // Estratégia 3: POST /members/member/list/{programId} com filtros por memberId
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
      pageSize: 20,
    }
  );
  
  if (listResult.status === 200 && listResult.data) {
    const listData = listResult.data as Record<string, unknown>;
    const results = (listData?.results || listData?.result || listData?.data || listData?.members) as Record<string, unknown>[] | undefined;
    
    if (Array.isArray(results) && results.length > 0) {
      // Filtrar membros válidos (não invalidados)
      const validMember = results.find(m => !isMemberInvalidated(m));
      if (validMember?.id) {
        console.log(`[resolveMember] Encontrado via list por memberId (válido): ${validMember.id}`);
        return { member: validMember as PassKitMember };
      }
      console.log(`[resolveMember] Encontrou ${results.length} membros por memberId, mas todos invalidados`);
    }
  }
  
  // Estratégia 4: Buscar por email do líder (campo suportado pela API)
  if (leaderEmail) {
    console.log(`[resolveMember] Tentativa 4: POST /members/member/list/${programId} (filtro por email: ${leaderEmail})`);
    const listByEmailResult = await passkitRequest(
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
                  filterField: "person.emailAddress",
                  filterValue: leaderEmail,
                  filterOperator: "eq",
                },
              ],
            },
          ],
        },
        page: 0,
        pageSize: 20,
      }
    );
    
    if (listByEmailResult.status === 200 && listByEmailResult.data) {
      const listData = listByEmailResult.data as Record<string, unknown>;
      const results = (listData?.results || listData?.result || listData?.data || listData?.members) as Record<string, unknown>[] | undefined;
      
      if (Array.isArray(results) && results.length > 0) {
        console.log(`[resolveMember] Encontrou ${results.length} membros por email`);
        // Filtrar membros cujo externalId corresponde ao leaderId (com ou sem timestamp)
        const matchingMembers = results.filter(m => {
          const extId = String(m.externalId || "");
          return extId === leaderId || extId.startsWith(`${leaderId}_`);
        });
        
        // Filtrar apenas membros válidos
        const validMembers = matchingMembers.filter(m => !isMemberInvalidated(m));
        
        if (validMembers.length > 0) {
          // Ordenar por externalId descendente (timestamp maior = mais recente)
          validMembers.sort((a, b) => {
            const extA = String(a.externalId || "");
            const extB = String(b.externalId || "");
            return extB.localeCompare(extA);
          });
          
          const bestMember = validMembers[0];
          console.log(`[resolveMember] Encontrado via email (válido, mais recente): ${bestMember.id} (externalId: ${bestMember.externalId})`);
          return { member: bestMember as PassKitMember };
        }
        console.log(`[resolveMember] Membros encontrados por email não correspondem ao líder ou estão invalidados`);
      }
    } else {
      console.log(`[resolveMember] Busca por email retornou status ${listByEmailResult.status}`);
    }
  }
  
  // Estratégia 5: Listar membros recentes e filtrar localmente por externalId
  // NOTA: A API do PassKit NÃO suporta filtrar por externalId diretamente - dá erro 400
  console.log(`[resolveMember] Tentativa 5: Listar membros recentes e filtrar localmente por externalId`);
  const listAllResult = await passkitRequest(
    "POST",
    `/members/member/list/${programId}`,
    apiToken,
    baseUrl,
    {
      page: 0,
      pageSize: 100,  // Buscar os últimos 100 membros
    }
  );
  
  if (listAllResult.status === 200 && listAllResult.data) {
    // LOG DE DIAGNÓSTICO - ver formato real da resposta
    console.log(`[resolveMember] Resposta da listagem - tipo: ${typeof listAllResult.data}, isArray: ${Array.isArray(listAllResult.data)}, keys: ${typeof listAllResult.data === 'object' && !Array.isArray(listAllResult.data) ? Object.keys(listAllResult.data as object).join(', ') : 'N/A'}`);
    
    // Tentar extrair array de membros de várias formas
    let results: Record<string, unknown>[] | undefined;
    
    if (Array.isArray(listAllResult.data)) {
      // Caso 1: data já é o array de membros diretamente
      results = listAllResult.data as Record<string, unknown>[];
      console.log(`[resolveMember] Data é um array direto com ${results.length} itens`);
    } else {
      // Caso 2: data é um objeto com uma propriedade contendo o array
      const listData = listAllResult.data as Record<string, unknown>;
      results = (listData?.results || listData?.result || listData?.data || listData?.members || listData?.passes) as Record<string, unknown>[] | undefined;
      
      if (!Array.isArray(results) || results.length === 0) {
        // Log para debug: mostrar estrutura da resposta
        console.log(`[resolveMember] Listagem não encontrou array de membros. Estrutura: ${JSON.stringify(listAllResult.data).substring(0, 500)}`);
      }
    }
    
    if (Array.isArray(results) && results.length > 0) {
      console.log(`[resolveMember] Listagem geral retornou ${results.length} membros, filtrando por externalId localmente...`);
      
      // Filtrar localmente por externalId que corresponde ao leaderId
      const matchingMembers = results.filter(m => {
        const extId = String(m.externalId || "");
        return extId === leaderId || extId.startsWith(`${leaderId}_`);
      });
      
      if (matchingMembers.length > 0) {
        console.log(`[resolveMember] Encontrou ${matchingMembers.length} membros com externalId correspondente`);
        
        // Filtrar apenas membros válidos (não invalidados)
        const validMembers = matchingMembers.filter(m => !isMemberInvalidated(m));
        
        if (validMembers.length > 0) {
          // Se há múltiplos válidos, pegar o mais recente (maior timestamp no externalId)
          validMembers.sort((a, b) => {
            const extA = String(a.externalId || "");
            const extB = String(b.externalId || "");
            return extB.localeCompare(extA);
          });
          
          const bestMember = validMembers[0];
          console.log(`[resolveMember] Encontrado via filtro local (válido, mais recente): ${bestMember.id} (externalId: ${bestMember.externalId})`);
          return { member: bestMember as PassKitMember };
        }
        console.log(`[resolveMember] Encontrou ${matchingMembers.length} membros correspondentes, mas todos invalidados`);
      } else {
        console.log(`[resolveMember] Nenhum membro na lista corresponde ao leaderId ${leaderId}`);
      }
    }
  } else {
    console.log(`[resolveMember] Listagem geral retornou status ${listAllResult.status}`);
  }
  
  console.log(`[resolveMember] Membro válido não encontrado por nenhuma estratégia`);
  return { member: null, error: "Membro válido não encontrado no PassKit (pode haver apenas membros invalidados)" };
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

        // Usar a função robusta de resolução de membro (passando email para busca alternativa)
        const { member, error: resolveError } = await resolveMember(
          leader.id,
          leader.passkit_member_id,
          settings.passkit_program_id!,
          settings.passkit_api_token!,
          passkitBaseUrl,
          leader.email  // Email para estratégia de busca por person.emailAddress
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

        // Verificar status do membro - pode estar em diferentes propriedades
        const memberStatus = (member as any).universalStatus || 
                             (member as any).status || 
                             ((member as any).recordData && (member as any).recordData["universal.status"]);
        
        console.log(`Status do membro: ${memberStatus}`);
        
        // Verificar se está invalidado (status 3 ou PASS_INVALIDATED)
        // NOTA: resolveMember já filtra invalidados, então isso é apenas uma proteção extra
        if (memberStatus === "PASS_INVALIDATED" || memberStatus === "3" || memberStatus === 3) {
          console.log(`Membro ${memberId} está INVALIDADO - limpando apenas cache do member_id`);
          
          // Limpar apenas o cache do member_id (forçar nova busca na próxima tentativa)
          // NÃO limpar passkit_pass_installed - o webhook é a fonte da verdade para isso
          await supabase
            .from("lideres")
            .update({
              passkit_member_id: null,  // Limpar cache para forçar nova resolução
              // NÃO definir passkit_pass_installed: false aqui
            })
            .eq("id", leader.id);
          
          results.push({
            success: false,
            leaderId: leader.id,
            leaderName: leader.nome_completo,
            error: "O membro encontrado estava invalidado. Tente novamente ou gere um novo cartão.",
          });
          continue;
        }

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

        // IMPORTANTE: Para disparar push notification no Apple Wallet:
        // O campo configurado no PassKit é "meta.notification" com changeMessage "%@"
        // Isso significa que metaData.notification é o campo que dispara o push
        // A mensagem PURA vai no campo notification (sem timestamps visíveis)
        // Usamos um campo SEPARADO (notificationTime) para garantir que metaData sempre mude
        const notificationValue = trimmedMessage;
        const notificationTimestamp = Date.now();
        
        console.log(`[Push Trigger] Campo meta.notification será: "${notificationValue}"`);
        console.log(`[Push Trigger] Campo notificationTime para unicidade: ${notificationTimestamp}`);

        // Contagem de notificações enviadas
        const nextNotificationCount = (parseFloat(String(existingMetaData.notificationCount || 0)) || 0) + 1;
        
        // Payload para PUT
        // O push é disparado pela mudança em metaData.notification (campo meta.notification no template)
        // O campo notificationTime garante que metaData sempre mude, forçando atualização do pass
        const updateData = {
          id: memberId,
          programId: settings.passkit_program_id,
          tierId: settings.passkit_tier_id,
          // Manter pontos inalterados - gamificação não deve ser afetada por notificações
          points: currentPoints,
          secondaryPoints: currentSecondaryPoints,
          metaData: {
            ...existingMetaData,
            notification: notificationValue,  // ESTE campo dispara o push (meta.notification no template) - mensagem pura
            notificationTime: String(notificationTimestamp),  // Campo separado para garantir unicidade
            lastMessage: trimmedMessage,
            lastMessageDate: now,
            notificationCount: String(nextNotificationCount),
          },
          passOverrides: existingPassOverrides  // Mantém os passOverrides existentes sem modificar backFields
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
          
          // Verificar se o erro é de membro invalidado
          if (updateResult.error.includes("cannot update invalided member") || 
              updateResult.error.includes("invalidated") ||
              updateResult.error.includes("invalid member")) {
            
            // IMPORTANTE: Se encontramos um membro invalidado, mas já filtramos invalidados na busca,
            // isso significa que o membro ficou invalidado DEPOIS que resolvemos ele.
            // Neste caso, limpar apenas o passkit_member_id para forçar nova resolução,
            // mas NÃO limpar passkit_pass_installed se ainda estiver true (pode haver outro membro válido)
            console.log(`Erro de membro invalidado detectado para ${memberId}`);
            
            // Limpar apenas o member_id cacheado (forçar nova busca na próxima vez)
            // Mas manter passkit_pass_installed como está - o webhook é a fonte da verdade
            await supabase
              .from("lideres")
              .update({
                passkit_member_id: null,  // Limpar cache do member_id
                // NÃO limpar passkit_pass_installed - o webhook atualiza isso
              })
              .eq("id", leader.id);
            
            results.push({
              success: false,
              leaderId: leader.id,
              leaderName: leader.nome_completo,
              error: "O membro encontrado estava invalidado. Tente novamente ou gere um novo cartão.",
            });
            continue;
          }
          
          results.push({
            success: false,
            leaderId: leader.id,
            leaderName: leader.nome_completo,
            error: `PUT falhou: ${updateResult.error}`
          });
          continue;
        }

        console.log(`PUT funcionou para ${leader.nome_completo} (status: ${updateResult.status})`);
        console.log(`✅ Push notification disparado via meta.notification = "${notificationValue}"`);
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
