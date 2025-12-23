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
  // PassKit pode aceitar formatos diferentes dependendo do cluster/versão.
  // 1) tentativa simples (filters.programId)
  const attempt1 = await passkitJson(baseUrl, token, "/members/tiers/list", {
    filters: {
      programId,
      limit: 100,
      offset: 0,
    },
  });

  if (attempt1.ok) return attempt1;

  const msg1 = (attempt1.json?.error?.message ?? attempt1.json?.message ?? attempt1.text ?? "").toString();
  // 2) fallback: formato de filterGroups (documentação antiga)
  if (msg1.toLowerCase().includes("please provide program id")) {
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

  return attempt1;
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

    const tiers: PassKitTier[] = Array.isArray(tiersRes.json)
      ? tiersRes.json
      : (
          tiersRes.json?.tiers ??
          tiersRes.json?.items ??
          tiersRes.json?.data ??
          tiersRes.json?.filters?.items ??
          []
        );

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

    // Buscar dados do líder
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
        cidade:cidade_id (nome)
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

    // Gerar URL do link de afiliado
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
    const affiliateUrl = leader.affiliate_token 
      ? `${baseUrl}/afiliado/${leader.affiliate_token}`
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
      },
      // Custom fields for the pass
      metaData: {
        leaderId: leader.id,
        affiliateToken: leader.affiliate_token || "",
        pontuacao: leader.pontuacao_total.toString(),
        cadastros: leader.cadastros.toString(),
        cidade: (leader.cidade as any)?.nome || "",
      },
      tierPoints: leader.pontuacao_total,
      secondaryPoints: leader.cadastros,
    };

    console.log("[create-leader-pass] Enviando para PassKit:", JSON.stringify(passData));

    // Chamar a API do PassKit para criar o membro
    // POST para criar novo, PUT para atualizar existente
    console.log(`[create-leader-pass] Chamando POST ${passkitBaseUrl}/members/member`);
    const passkitResponse = await fetch(`${passkitBaseUrl}/members/member`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${passkitToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passData),
    });

    if (!passkitResponse.ok) {
      const errorText = await passkitResponse.text();
      console.error("[create-leader-pass] Erro PassKit:", passkitResponse.status, errorText);
      
      // Tentar com abordagem alternativa - criar passe genérico
      console.log(`[create-leader-pass] Tentando fallback: ${passkitBaseUrl}/coupon/singleUse/coupon`);
      const genericPassResponse = await fetch(`${passkitBaseUrl}/coupon/singleUse/coupon`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${passkitToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalId: leader.id,
          sku: `leader-${leader.id}`,
          person: {
            displayName: leader.nome_completo,
            emailAddress: leader.email || undefined,
          },
        }),
      });

      if (!genericPassResponse.ok) {
        const genericError = await genericPassResponse.text();
        console.error("[create-leader-pass] Erro PassKit (generic):", genericPassResponse.status, genericError);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Erro ao criar passe no PassKit. Verifique suas credenciais e configurações.",
            details: errorText
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const genericResult = await genericPassResponse.json();
      console.log("[create-leader-pass] Passe genérico criado:", genericResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            passId: genericResult.id,
            passUrl: genericResult.url || genericResult.passUrl,
            message: "Passe criado com sucesso"
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
