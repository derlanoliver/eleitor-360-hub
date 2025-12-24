import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeaderPassRequest {
  leaderId: string;
}

type PassKitTier = {
  id: string;
  programId?: string;
  name?: string;
};

async function passkitJson(
  baseUrl: string,
  token: string,
  path: string,
  body: unknown
): Promise<{ ok: boolean; status: number; text: string; json: any }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: res.ok, status: res.status, text, json };
}

async function listMemberTiers(baseUrl: string, token: string, programId: string) {
  // PassKit pode variar o formato do payload por cluster/versão.
  // Tentamos 3 formatos, do mais simples ao mais verboso.

  // A) raiz: programId (alguns clusters exigem isso)
  const attemptA = await passkitJson(baseUrl, token, "/members/tiers/list", {
    programId,
    limit: 100,
  });
  if (attemptA.ok) return attemptA;

  const msgA = (attemptA.json?.error?.message ?? attemptA.json?.message ?? attemptA.text ?? "").toString();

  // B) filters.programId
  const attemptB = await passkitJson(baseUrl, token, "/members/tiers/list", {
    filters: {
      programId,
      limit: 100,
      offset: 0,
    },
  });
  if (attemptB.ok) return attemptB;

  const msgB = (attemptB.json?.error?.message ?? attemptB.json?.message ?? attemptB.text ?? "").toString();

  // C) filters.filterGroups (documentação antiga)
  const needsProgramId = `${msgA} ${msgB}`.toLowerCase().includes("please provide program id");
  if (needsProgramId) {
    return passkitJson(baseUrl, token, "/members/tiers/list", {
      filters: {
        limit: 100,
        offset: 0,
        orderBy: "created",
        orderAsc: true,
        filterGroups: [
          {
            condition: "AND",
            fieldFilters: [
              { filterField: "programId", filterOperator: "eq", filterValue: programId },
            ],
          },
        ],
      },
    });
  }

  // Retorna o último erro relevante
  return attemptB;
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

    const { leaderId }: LeaderPassRequest = await req.json();

    if (!leaderId) {
      return new Response(
        JSON.stringify({ success: false, error: "leaderId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-leader-pass] Gerando passe para líder: ${leaderId}`);

    // Buscar configurações do PassKit
    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("passkit_api_token, passkit_enabled, passkit_api_base_url, passkit_program_id, passkit_tier_id")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error("[create-leader-pass] Erro ao buscar configurações:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Configurações não encontradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passkitToken = (settings.passkit_api_token ?? "").trim();
    const passkitBaseUrl = (settings.passkit_api_base_url ?? "https://api.pub1.passkit.io").trim();
    const passkitProgramId = (settings.passkit_program_id ?? "").trim();
    const passkitTierId = (settings.passkit_tier_id ?? "").trim();

    if (!settings.passkit_enabled || !passkitToken || !passkitProgramId || !passkitTierId) {
      return new Response(
        JSON.stringify({ success: false, error: "PassKit não está configurado completamente. Verifique Token, Program ID e Tier ID." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Debug seguro
    console.log(
      `[create-leader-pass] PassKit baseUrl=${passkitBaseUrl} programId=${passkitProgramId} tierId=${passkitTierId}`
    );

    // Validar se o Tier pertence ao Program (melhora diagnóstico quando o Tier ID está errado)
    const tiersRes = await listMemberTiers(passkitBaseUrl, passkitToken, passkitProgramId);
    if (!tiersRes.ok) {
      console.error("[create-leader-pass] Falha ao listar tiers:", tiersRes.status, tiersRes.text);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Não foi possível validar o Tier no PassKit. Verifique Base URL e Token.",
          details: tiersRes.text,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parseia resposta NDJSON (PassKit pode retornar múltiplos objetos JSON separados por newline)
    let tiers: PassKitTier[] = [];
    if (Array.isArray(tiersRes.json)) {
      tiers = tiersRes.json;
    } else if (tiersRes.json?.tiers || tiersRes.json?.items || tiersRes.json?.data || tiersRes.json?.filters?.items) {
      tiers =
        tiersRes.json?.tiers ??
        tiersRes.json?.items ??
        tiersRes.json?.data ??
        tiersRes.json?.filters?.items ??
        [];
    } else if (typeof tiersRes.text === "string" && tiersRes.text.includes('{"result"')) {
      // NDJSON: cada linha é {"result": {...}}
      const lines = tiersRes.text.split("\n").filter((l) => l.trim().startsWith("{"));
      tiers = lines.map((line) => {
        try {
          const parsed = JSON.parse(line);
          const r = parsed.result ?? parsed;
          return { id: r.id, name: r.name, programId: r.programId };
        } catch {
          return null;
        }
      }).filter(Boolean) as PassKitTier[];
    }

    if (!tiers.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Nenhum Tier encontrado para este Program ID no PassKit (ou Program ID inválido).",
          details: {
            programId: passkitProgramId,
            tierId: passkitTierId,
            raw: tiersRes.json ?? tiersRes.text,
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tierId
    const tierExists = tiers.some((t) => t?.id === passkitTierId);
    if (!tierExists) {
      const available = tiers.slice(0, 20).map((t) => ({ id: t.id, name: t.name ?? "" }));
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Tier ID inválido. Use um dos IDs listados abaixo (copie o 'id', não o 'passTemplateId').",
          details: {
            programId: passkitProgramId,
            tierId: passkitTierId,
            availableTiers: available,
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados do líder com campos adicionais
    const { data: leader, error: leaderError } = await supabase
      .from("lideres")
      .select(`
        id,
        nome_completo,
        telefone,
        email,
        affiliate_token,
        pontuacao_total,
        cadastros,
        data_nascimento,
        join_date,
        hierarchy_level,
        is_coordinator,
        is_verified,
        verified_at,
        cidade:cidade_id (nome),
        parent_leader:parent_leader_id (nome_completo)
      `)
      .eq("id", leaderId)
      .single();

    if (leaderError || !leader) {
      console.error("[create-leader-pass] Líder não encontrado:", leaderError);
      return new Response(
        JSON.stringify({ success: false, error: "Líder não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados da organização
    const { data: org } = await supabase
      .from("organization")
      .select("nome, logo_url, cargo")
      .limit(1)
      .single();

    const organizationName = org?.nome || "Gabinete";
    const logoUrl = org?.logo_url || "";

    // Funções auxiliares
    const formatDate = (dateStr: string | null): string => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR");
      } catch {
        return "";
      }
    };

    const getNivelNome = (level: number | null, isCoordinator: boolean | null): string => {
      if (isCoordinator) return "Coordenador";
      if (level === null || level === undefined) return "Líder";
      if (level === 1) return "Líder Nível 1";
      if (level === 2) return "Líder Nível 2";
      if (level === 3) return "Líder Nível 3";
      return `Líder Nível ${level}`;
    };

    // Gerar URL do link de afiliado
    const siteBaseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
    const affiliateUrl = leader.affiliate_token 
      ? `${siteBaseUrl}/afiliado/${leader.affiliate_token}`
      : "";

    // Criar o passe via PassKit API usando Bearer Token
    const passData = {
      // Member pass data - incluindo programId e tierId obrigatórios
      programId: passkitProgramId,
      tierId: passkitTierId,
      externalId: leader.id,
      person: {
        displayName: leader.nome_completo,
        emailAddress: leader.email || undefined,
        mobileNumber: leader.telefone || undefined,
      },
      // Custom fields for the pass - dados completos do líder
      metaData: {
        // Dados básicos
        leaderId: leader.id,
        affiliateToken: leader.affiliate_token || "",
        affiliateUrl: affiliateUrl,
        // Pontuação
        pontuacao: leader.pontuacao_total.toString(),
        cadastros: leader.cadastros.toString(),
        // Localização
        cidade: (leader.cidade as any)?.nome || "",
        // Contato
        telefone: leader.telefone || "",
        email: leader.email || "",
        // Hierarquia
        nivel: getNivelNome(leader.hierarchy_level, leader.is_coordinator),
        nivelNumero: (leader.hierarchy_level ?? 0).toString(),
        coordenador: leader.is_coordinator ? "Sim" : "Não",
        liderSuperior: (leader.parent_leader as any)?.nome_completo || "",
        // Datas
        membroDesde: formatDate(leader.join_date),
        dataNascimento: leader.data_nascimento || "",
        // Verificação
        verificado: leader.is_verified ? "Sim" : "Não",
        verificadoEm: formatDate(leader.verified_at),
        // Organização
        organizacao: organizationName,
      },
      tierPoints: leader.pontuacao_total,
      secondaryPoints: leader.cadastros,
    };

    console.log("[create-leader-pass] Enviando para PassKit:", JSON.stringify(passData));

    // Chamar a API do PassKit para criar o membro
    console.log(`[create-leader-pass] Chamando POST ${passkitBaseUrl}/members/member`);
    let passkitResponse = await fetch(`${passkitBaseUrl}/members/member`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${passkitToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passData),
    });

    // Se o membro já existe (409), tentar atualizar com PUT
    if (passkitResponse.status === 409) {
      console.log("[create-leader-pass] Membro já existe, tentando atualizar...");
      
      // Primeiro buscar o membro existente para obter o ID interno
      const getMemberUrl = `${passkitBaseUrl}/members/member/external/${passkitProgramId}/${leader.id}`;
      console.log(`[create-leader-pass] Buscando membro existente: ${getMemberUrl}`);
      
      const getMemberResponse = await fetch(getMemberUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${passkitToken}`,
        },
      });

      if (getMemberResponse.ok) {
        const existingMember = await getMemberResponse.json();
        console.log("[create-leader-pass] Membro encontrado:", existingMember);
        
        // Atualizar o membro com PUT
        const updateData = {
          ...passData,
          id: existingMember.id, // ID interno do PassKit
        };
        
        console.log(`[create-leader-pass] Atualizando membro: PUT ${passkitBaseUrl}/members/member`);
        const updateResponse = await fetch(`${passkitBaseUrl}/members/member`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${passkitToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log("[create-leader-pass] Membro atualizado com sucesso:", updateResult);
          
          // Retornar o passe existente atualizado
          const passUrl = existingMember.passOverrides?.passUrl || 
                         existingMember.urls?.landingPage ||
                         `https://pub2.pskt.io/${existingMember.id}`;
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: {
                passId: existingMember.id,
                passUrl: passUrl,
                message: "Passe atualizado com sucesso",
                updated: true
              }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          const updateError = await updateResponse.text();
          console.error("[create-leader-pass] Erro ao atualizar:", updateResponse.status, updateError);
        }
      }
      
      // Se conseguimos encontrar o membro mas não atualizar, pelo menos retornar o passe existente
      if (getMemberResponse.ok) {
        const existingMember = await getMemberResponse.json();
        const passUrl = existingMember.passOverrides?.passUrl || 
                       existingMember.urls?.landingPage ||
                       `https://pub2.pskt.io/${existingMember.id}`;
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              passId: existingMember.id,
              passUrl: passUrl,
              message: "Passe já existente recuperado",
              existing: true
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!passkitResponse.ok) {
      const errorText = await passkitResponse.text();
      console.error("[create-leader-pass] Erro PassKit:", passkitResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro ao criar passe no PassKit. Verifique suas credenciais e configurações.",
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await passkitResponse.json();
    console.log("[create-leader-pass] Passe criado com sucesso:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          passId: result.id,
          passUrl: result.url || result.passUrl,
          appleUrl: result.appleUrl,
          googleUrl: result.googleUrl,
          message: "Passe criado com sucesso"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[create-leader-pass] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
