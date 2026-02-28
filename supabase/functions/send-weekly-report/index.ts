import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { phone, groupId } = body;

    const destination = phone || groupId;
    if (!destination) {
      return new Response(JSON.stringify({ success: false, error: "phone or groupId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate week range (Monday to now)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();

    console.log(`[weekly-report] Generating report from ${weekStartISO} to now`);

    // 1. Contacts registered this week
    const { count: contactsThisWeek } = await supabase
      .from("office_contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStartISO);

    // 2. Leaders registered this week
    const { count: leadersThisWeek } = await supabase
      .from("lideres")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStartISO);

    // 3. Mentions this week
    const { data: mentionsData } = await supabase
      .from("po_mentions")
      .select("id")
      .gte("collected_at", weekStartISO);
    const totalMentions = mentionsData?.length || 0;

    // 4. Sentiment breakdown
    let positiveCount = 0;
    let negativeCount = 0;
    let complaintCount = 0;

    if (totalMentions > 0) {
      const mentionIds = mentionsData!.map((m) => m.id);

      // Fetch in batches of 500
      const batchSize = 500;
      const allAnalyses: any[] = [];
      for (let i = 0; i < mentionIds.length; i += batchSize) {
        const batch = mentionIds.slice(i, i + batchSize);
        const { data: analyses } = await supabase
          .from("po_sentiment_analyses")
          .select("sentiment_score, category")
          .in("mention_id", batch);
        if (analyses) allAnalyses.push(...analyses);
      }

      for (const a of allAnalyses) {
        const score = Number(a.sentiment_score);
        if (score > 0.2) positiveCount++;
        else if (score < -0.2) negativeCount++;

        if (a.category === "reclamacao" || a.category === "critica") {
          complaintCount++;
        }
      }
    }

    // 5. Events this week
    const { data: eventsThisWeek } = await supabase
      .from("events")
      .select("id, name, registrations_count, checkedin_count")
      .gte("date", weekStart.toISOString().split("T")[0]);

    const totalEvents = eventsThisWeek?.length || 0;
    const totalRegistrations = eventsThisWeek?.reduce((s, e) => s + (e.registrations_count || 0), 0) || 0;
    const totalCheckins = eventsThisWeek?.reduce((s, e) => s + (e.checkedin_count || 0), 0) || 0;
    const attendanceRate = totalRegistrations > 0 ? ((totalCheckins / totalRegistrations) * 100).toFixed(1) : "0";

    // 6. Campaign materials distributed this week
    const { data: withdrawals } = await supabase
      .from("material_reservations")
      .select("quantidade, leader_id")
      .gte("withdrawn_at", weekStartISO)
      .eq("status", "withdrawn");
    const totalDistributed = withdrawals?.reduce((s, w) => s + (w.quantidade || 0), 0) || 0;

    // 7. Top region for materials
    let topRegion = "N/A";
    let topRegionQty = 0;

    if (withdrawals && withdrawals.length > 0) {
      const leaderIds = [...new Set(withdrawals.map((w) => w.leader_id))];
      
      // Get leaders' cities
      const { data: leaders } = await supabase
        .from("lideres")
        .select("id, cidade_id")
        .in("id", leaderIds);

      if (leaders) {
        const cityQty: Record<string, number> = {};
        for (const w of withdrawals) {
          const leader = leaders.find((l) => l.id === w.leader_id);
          if (leader?.cidade_id) {
            cityQty[leader.cidade_id] = (cityQty[leader.cidade_id] || 0) + (w.quantidade || 0);
          }
        }

        const topCityId = Object.entries(cityQty).sort((a, b) => b[1] - a[1])[0];
        if (topCityId) {
          topRegionQty = topCityId[1];
          const { data: city } = await supabase
            .from("office_cities")
            .select("nome")
            .eq("id", topCityId[0])
            .single();
          topRegion = city?.nome || "Desconhecida";
        }
      }
    }

    // Build report message
    const weekLabel = `${weekStart.toLocaleDateString("pt-BR")} a ${now.toLocaleDateString("pt-BR")}`;

    const report = `🔷 *ELEITOR 360 — RELATÓRIO SEMANAL*
📅 ${weekLabel}

👥 *Cadastros da Semana*
• Contatos: ${contactsThisWeek || 0}
• Líderes: ${leadersThisWeek || 0}

📣 *Menções (Opinião Pública)*
• Total: ${totalMentions}
• ✅ Positivas: ${positiveCount}
• ❌ Negativas: ${negativeCount}
• ⚠️ Reclamações: ${complaintCount}

🎯 *Eventos*
• Realizados: ${totalEvents}
• Inscritos totais: ${totalRegistrations}
• Presença: ${totalCheckins} (${attendanceRate}%)

📦 *Material de Campanha*
• Distribuído: ${totalDistributed} unidades
• Região destaque: ${topRegion}${topRegionQty > 0 ? ` (${topRegionQty} un.)` : ""}

_Relatório gerado automaticamente pelo Eleitor 360._`;

    console.log("[weekly-report] Report:\n", report);

    // Get Z-API credentials
    const { data: settings } = await supabase
      .from("integrations_settings")
      .select("zapi_instance_id, zapi_token, zapi_client_token")
      .limit(1)
      .single();

    if (!settings?.zapi_instance_id || !settings?.zapi_token) {
      return new Response(
        JSON.stringify({ success: false, error: "Z-API not configured", report }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Z-API
    const isGroup = !!groupId;
    const endpoint = isGroup
      ? `https://api.z-api.io/instances/${settings.zapi_instance_id}/token/${settings.zapi_token}/send-text`
      : `https://api.z-api.io/instances/${settings.zapi_instance_id}/token/${settings.zapi_token}/send-text`;

    const cleanPhone = phone ? phone.replace(/\D/g, "") : undefined;

    const zapiBody = isGroup
      ? { phone: groupId, message: report, isGroup: true }
      : { phone: cleanPhone, message: report };

    const zapiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (settings.zapi_client_token) {
      zapiHeaders["Client-Token"] = settings.zapi_client_token;
    }

    const zapiResponse = await fetch(endpoint, {
      method: "POST",
      headers: zapiHeaders,
      body: JSON.stringify(zapiBody),
    });

    const zapiResult = await zapiResponse.text();
    console.log("[weekly-report] Z-API response:", zapiResult);

    // Log to whatsapp_messages
    await supabase.from("whatsapp_messages").insert({
      phone: cleanPhone || groupId,
      message: report,
      status: zapiResponse.ok ? "sent" : "failed",
      direction: "outgoing",
      template_slug: "weekly-report",
      sent_at: new Date().toISOString(),
      provider: "zapi",
      error_message: zapiResponse.ok ? null : zapiResult,
    });

    return new Response(
      JSON.stringify({
        success: zapiResponse.ok,
        report,
        zapiResponse: zapiResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[weekly-report] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
