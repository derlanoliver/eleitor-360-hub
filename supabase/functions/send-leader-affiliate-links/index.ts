import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Leader {
  id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  affiliate_token: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let leaderId: string | null = null;

    try {
      const body = await req.json();
      leaderId = body?.leader_id || null;
    } catch {
      // No body provided
    }

    console.log(`[send-leader-affiliate-links] Mode: ${leaderId ? 'single leader: ' + leaderId : 'batch processing'}`);

    const baseUrl = "https://app.rafaelprudente.com";

    // If specific leader_id provided, process just that leader
    if (leaderId) {
      const result = await processLeader(supabase, leaderId, baseUrl);
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch processing: find verified leaders from last 7 days without SMS/Email sent
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentLeaders, error: leadersError } = await supabase
      .from("lideres")
      .select("id, nome_completo, telefone, email, affiliate_token, verified_at")
      .eq("is_active", true)
      .eq("is_verified", true)
      .not("affiliate_token", "is", null)
      .gte("verified_at", sevenDaysAgo.toISOString())
      .order("verified_at", { ascending: false });

    if (leadersError) {
      console.error("[send-leader-affiliate-links] Error fetching leaders:", leadersError);
      throw new Error(leadersError.message);
    }

    console.log(`[send-leader-affiliate-links] Found ${recentLeaders?.length || 0} recently verified leaders (last 7 days)`);

    if (!recentLeaders || recentLeaders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending leaders", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];
    let processedCount = 0;
    let skippedCount = 0;

    for (const leader of recentLeaders) {
      if (!leader.telefone && !leader.email) {
        console.log(`[send-leader-affiliate-links] Skipping ${leader.nome_completo}: no contact info`);
        skippedCount++;
        continue;
      }

      // Check if welcome SMS already sent for this leader (check by leader_id pattern in message or phone)
      const phoneNormalized = leader.telefone?.replace(/\D/g, "").slice(-8) || "";
      
      const { data: existingSMS } = await supabase
        .from("sms_messages")
        .select("id")
        .or(`message.ilike.%link de indicacao%,message.ilike.%cadastro confirmado%,message.ilike.%indicar pessoas%`)
        .ilike("phone", `%${phoneNormalized}`)
        .limit(1);

      // Check if welcome Email already sent for this leader (using leader_id directly)
      const { data: existingEmail } = await supabase
        .from("email_logs")
        .select("id, subject")
        .eq("leader_id", leader.id)
        .or(`subject.ilike.%boas-vindas%,subject.ilike.%confirmado%,subject.ilike.%cadastro%`)
        .limit(1);

      const hasSMS = existingSMS && existingSMS.length > 0;
      const hasEmail = existingEmail && existingEmail.length > 0;

      // Skip only if BOTH were already sent (to ensure both channels are covered)
      if (hasSMS && hasEmail) {
        console.log(`[send-leader-affiliate-links] Skipping ${leader.nome_completo}: already has SMS and Email`);
        skippedCount++;
        continue;
      }

      // Process to send missing channels
      const result = await processLeader(supabase, leader.id, baseUrl, leader, hasSMS ?? false, hasEmail ?? false);
      results.push(result);
      processedCount++;

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[send-leader-affiliate-links] Done. Processed: ${processedCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        skipped: skippedCount,
        total: recentLeaders.length,
        results: results.slice(0, 5),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-leader-affiliate-links] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processLeader(
  supabase: any,
  leaderId: string,
  baseUrl: string,
  leaderData?: Leader,
  skipSMS: boolean = false,
  skipEmail: boolean = false
): Promise<{ leader_id: string; nome: string; sms_sent: boolean; email_sent: boolean; errors: string[] }> {
  const errors: string[] = [];

  let leader = leaderData;
  if (!leader) {
    const { data, error } = await supabase
      .from("lideres")
      .select("id, nome_completo, telefone, email, affiliate_token")
      .eq("id", leaderId)
      .single();

    if (error || !data) {
      console.error(`[processLeader] Failed to fetch leader ${leaderId}:`, error);
      return { leader_id: leaderId, nome: "Unknown", sms_sent: false, email_sent: false, errors: ["Leader not found"] };
    }
    leader = data as Leader;
  }

  console.log(`[processLeader] Processing: ${leader.nome_completo} (${leader.id}) - skipSMS=${skipSMS}, skipEmail=${skipEmail}`);

  const affiliateLink = `${baseUrl}/cadastro/${leader.affiliate_token}`;
  let smsSent = skipSMS; // Mark as "sent" if we're skipping
  let emailSent = skipEmail; // Mark as "sent" if we're skipping

  // Send SMS (only if not skipping)
  if (!skipSMS && leader.telefone) {
    try {
      const smsResponse = await supabase.functions.invoke("send-sms", {
        body: {
          phone: leader.telefone,
          templateSlug: "lider-cadastro-confirmado-sms",
          variables: {
            nome: leader.nome_completo,
            link_indicacao: affiliateLink,
          },
        },
      });

      if (smsResponse.error) {
        errors.push(`SMS: ${smsResponse.error.message || "Error"}`);
        console.error(`[processLeader] SMS error for ${leader.nome_completo}:`, smsResponse.error);
      } else {
        smsSent = true;
        console.log(`[processLeader] SMS sent to ${leader.nome_completo}`);
      }
    } catch (e) {
      errors.push(`SMS exception: ${String(e)}`);
      console.error(`[processLeader] SMS exception for ${leader.nome_completo}:`, e);
    }
  } else if (!leader.telefone) {
    console.log(`[processLeader] No phone for ${leader.nome_completo}, skipping SMS`);
  }

  // Send Email (only if not skipping)
  if (!skipEmail && leader.email) {
    try {
      const emailResponse = await supabase.functions.invoke("send-email", {
        body: {
          to: leader.email,
          toName: leader.nome_completo,
          templateSlug: "lideranca-boas-vindas",
          leaderId: leader.id,
          variables: {
            nome: leader.nome_completo,
            link_indicacao: affiliateLink,
          },
        },
      });

      if (emailResponse.error) {
        errors.push(`Email: ${emailResponse.error.message || "Error"}`);
        console.error(`[processLeader] Email error for ${leader.nome_completo}:`, emailResponse.error);
      } else {
        emailSent = true;
        console.log(`[processLeader] Email sent to ${leader.nome_completo}`);
      }
    } catch (e) {
      errors.push(`Email exception: ${String(e)}`);
      console.error(`[processLeader] Email exception for ${leader.nome_completo}:`, e);
    }
  } else if (!leader.email) {
    console.log(`[processLeader] No email for ${leader.nome_completo}, skipping Email`);
  }

  return {
    leader_id: leader.id,
    nome: leader.nome_completo,
    sms_sent: smsSent,
    email_sent: emailSent,
    errors,
  };
}
