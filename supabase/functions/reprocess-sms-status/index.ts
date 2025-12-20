import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_MAP: Record<string, string> = {
  "0": "queued",
  "1": "sent",
  "2": "delivered",
  "3": "failed",
  "4": "failed",
  "FILA": "queued",
  "ENVIADO": "sent",
  "ENVIADA": "sent",
  "ENTREGUE": "delivered",
  "RECEBIDA": "delivered",
  "CLICADA": "delivered",
  "ERRO": "failed",
  "FALHA": "failed",
  "BLOQUEADO": "failed",
  "CANCELADO": "failed",
  "INVALIDO": "failed",
  "OK": "sent",
};

interface SMSMessageRow {
  id: string;
  message_id: string | null;
  status: string;
  created_at: string;
}

interface SMSDEVStatusResponse {
  situacao?: string;
  status?: string;
  descricao?: string;
  codigo?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 500, days = 30 } = (await req.json().catch(() => ({}))) as {
      limit?: number;
      days?: number;
    };

    const safeLimit = Math.max(1, Math.min(2000, Number(limit) || 500));
    const safeDays = Math.max(1, Math.min(365, Number(days) || 30));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings, error: settingsError } = await supabase
      .from("integrations_settings")
      .select("smsdev_api_key, smsdev_enabled")
      .limit(1)
      .single();

    if (settingsError || !settings?.smsdev_enabled || !settings?.smsdev_api_key) {
      console.log("[reprocess-sms-status] SMSDEV not enabled or API key not configured", settingsError);
      return json({ success: false, error: "SMSDEV not enabled or API key not configured" }, 200);
    }

    const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();

    // PostgREST has a default max of 1000 rows per request; fetch in pages.
    const pageSize = 1000;
    let messages: SMSMessageRow[] = [];
    let from = 0;

    while (messages.length < safeLimit) {
      const to = Math.min(from + pageSize - 1, safeLimit - 1);

      const { data: page, error: pageError } = await supabase
        .from("sms_messages")
        .select("id, message_id, status, created_at")
        .in("status", ["queued", "sent", "pending"])
        .not("message_id", "is", null)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (pageError) {
        console.error("[reprocess-sms-status] Error fetching messages:", pageError);
        return json({ success: false, error: pageError.message }, 500);
      }

      if (!page || page.length === 0) break;

      messages = messages.concat(page as SMSMessageRow[]);

      if (page.length < pageSize) break;
      from += pageSize;
    }


    if (!messages || messages.length === 0) {
      return json({ success: true, checked: 0, updated: 0, limit: safeLimit, days: safeDays });
    }

    console.log(
      `[reprocess-sms-status] Reprocessing ${messages.length} messages (limit=${safeLimit}, days=${safeDays})`
    );

    let checked = 0;
    let updated = 0;

    const rows = messages as SMSMessageRow[];
    const chunkSize = 25;

    const processOne = async (msg: SMSMessageRow) => {
      if (!msg.message_id) return { checked: 0, updated: 0 };

      const statusUrl = `https://api.smsdev.com.br/v1/dlr?key=${settings.smsdev_api_key}&id=${msg.message_id}`;

      const response = await fetch(statusUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.log(`[reprocess-sms-status] API error for ${msg.message_id}: ${response.status}`);
        return { checked: 1, updated: 0 };
      }

      const statusData: SMSDEVStatusResponse = await response.json();

      let rawStatus: string | undefined;
      if (statusData.situacao === "OK" && statusData.descricao) {
        rawStatus = statusData.descricao;
      } else {
        rawStatus = statusData.situacao || statusData.status || statusData.codigo || statusData.descricao;
      }

      if (!rawStatus) return { checked: 1, updated: 0 };

      const normalizedStatus = rawStatus.toString().toUpperCase();
      const mappedStatus = STATUS_MAP[normalizedStatus] || STATUS_MAP[rawStatus];

      if (!mappedStatus) {
        console.log(`[reprocess-sms-status] Unknown status '${rawStatus}' for ${msg.message_id}`);
        return { checked: 1, updated: 0 };
      }

      if (mappedStatus === msg.status) return { checked: 1, updated: 0 };

      const updateData: Record<string, unknown> = {
        status: mappedStatus,
        updated_at: new Date().toISOString(),
      };

      if (mappedStatus === "sent") {
        updateData.sent_at = new Date().toISOString();
      } else if (mappedStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
        updateData.sent_at = new Date().toISOString();
      } else if (mappedStatus === "failed") {
        updateData.error_message = statusData.descricao || `Falha no envio (código: ${rawStatus})`;
      }

      const { error: updateError } = await supabase
        .from("sms_messages")
        .update(updateData)
        .eq("id", msg.id);

      if (updateError) {
        console.error(`[reprocess-sms-status] Update error for ${msg.id}:`, updateError);
        return { checked: 1, updated: 0 };
      }

      return { checked: 1, updated: 1 };
    };

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      const results = await Promise.allSettled(
        chunk.map(async (msg) => {
          try {
            return await processOne(msg);
          } catch (e) {
            console.error(`[reprocess-sms-status] Error processing ${msg.message_id}:`, e);
            return { checked: 1, updated: 0 };
          }
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          checked += r.value.checked;
          updated += r.value.updated;
        } else {
          checked += 1;
        }
      }
    }

    console.log(`[reprocess-sms-status] Completed. Checked: ${checked}, Updated: ${updated}`);

    return json({ success: true, checked, updated, limit: safeLimit, days: safeDays });
  } catch (error) {
    console.error("[reprocess-sms-status] Error:", error);
    return json({ success: false, error: (error as Error).message }, 500);
  }
});
