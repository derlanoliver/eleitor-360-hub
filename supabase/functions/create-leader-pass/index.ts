import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeaderPassRequest {
  leaderId: string;
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
      .select("passkit_api_token, passkit_enabled")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error("[create-leader-pass] Erro ao buscar configurações:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Configurações não encontradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.passkit_enabled || !settings.passkit_api_token) {
      return new Response(
        JSON.stringify({ success: false, error: "PassKit não está configurado ou habilitado" }),
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
      // Member pass data
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
    };

    console.log("[create-leader-pass] Enviando para PassKit:", JSON.stringify(passData));

    // Chamar a API do PassKit para criar/atualizar o membro
    // Usando a API de Members (https://docs.passkit.io/protocols/member/)
    const passkitResponse = await fetch("https://api.pub1.passkit.io/members/member", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${settings.passkit_api_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...passData,
        // Incluir dados adicionais para exibição no passe
        tierPoints: leader.pontuacao_total,
        secondaryPoints: leader.cadastros,
      }),
    });

    if (!passkitResponse.ok) {
      const errorText = await passkitResponse.text();
      console.error("[create-leader-pass] Erro PassKit:", passkitResponse.status, errorText);
      
      // Tentar com abordagem alternativa - criar passe genérico
      const genericPassResponse = await fetch("https://api.pub1.passkit.io/coupon/singleUse/coupon", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.passkit_api_token}`,
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
