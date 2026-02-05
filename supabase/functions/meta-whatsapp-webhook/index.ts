import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VERIFY_TOKEN = "LOVABLE_META_WEBHOOK_2024";

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ===== WEBHOOK VERIFICATION (GET) =====
  // Meta sends a GET request to verify the webhook URL
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('[Meta Webhook] Verification request:', { mode, token, challenge: challenge?.substring(0, 20) + '...' });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Meta Webhook] ✅ Verification successful');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      console.error('[Meta Webhook] ❌ Verification failed - token mismatch');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // ===== MESSAGE PROCESSING (POST) =====
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('[Meta Webhook] Received payload:', JSON.stringify(body, null, 2));

      // Validate it's a WhatsApp message
      if (body.object !== 'whatsapp_business_account') {
        console.log('[Meta Webhook] Not a WhatsApp event, ignoring');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Process each entry
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          
          // Process incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              const from = message.from; // Phone number in E.164 format
              const messageId = message.id;
              const timestamp = message.timestamp;
              const messageType = message.type;
              
              let messageText = '';
              if (messageType === 'text') {
                messageText = message.text?.body || '';
              } else if (messageType === 'button') {
                messageText = message.button?.text || '';
              } else if (messageType === 'interactive') {
                messageText = message.interactive?.button_reply?.title || 
                              message.interactive?.list_reply?.title || '';
              }

              console.log('[Meta Webhook] Processing message:', {
                from,
                messageId,
                messageType,
                messageText: messageText.substring(0, 100),
              });

              // Log the incoming message
              await supabase.from('whatsapp_messages').insert({
                phone: from,
                message: messageText,
                direction: 'inbound',
                status: 'received',
                provider: 'meta_cloud',
                external_id: messageId,
                metadata: {
                  type: messageType,
                  timestamp,
                  raw: message,
                },
              });

              // Check for verification keywords
              const { data: settings } = await supabase
                .from('integrations_settings')
                .select('verification_wa_keyword, verification_wa_enabled')
                .single();

              if (settings?.verification_wa_enabled) {
                const keyword = settings.verification_wa_keyword?.toUpperCase() || 'CONFIRMAR';
                const normalizedMessage = messageText.toUpperCase().trim();

                if (normalizedMessage === keyword || normalizedMessage.startsWith(keyword)) {
                  console.log('[Meta Webhook] Verification keyword detected from:', from);
                  
                  // Find pending verification for this phone
                  const normalizedPhone = from.replace(/\D/g, '');
                  const { data: verification } = await supabase
                    .from('contact_verifications')
                    .select('*')
                    .eq('phone', normalizedPhone)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                  if (verification) {
                    // Update verification status
                    await supabase
                      .from('contact_verifications')
                      .update({
                        status: 'verified',
                        verified_at: new Date().toISOString(),
                        keyword_received_at: new Date().toISOString(),
                        consent_channel: 'whatsapp',
                        consent_received_at: new Date().toISOString(),
                      })
                      .eq('id', verification.id);

                    // Update the contact/leader as verified
                    if (verification.contact_type === 'contact') {
                      await supabase
                        .from('office_contacts')
                        .update({
                          is_verified: true,
                          verified_at: new Date().toISOString(),
                        })
                        .eq('id', verification.contact_id);
                    } else if (verification.contact_type === 'leader') {
                      await supabase
                        .from('lideres')
                        .update({
                          is_verified: true,
                          verified_at: new Date().toISOString(),
                        })
                        .eq('id', verification.contact_id);
                    }

                    console.log('[Meta Webhook] ✅ Verification completed for:', from);
                  }
                }
              }
            }
          }

          // Process status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              const messageId = status.id;
              const statusValue = status.status; // sent, delivered, read, failed
              const recipientId = status.recipient_id;

              console.log('[Meta Webhook] Status update:', { messageId, status: statusValue, recipientId });

              // Update message status in database
              const { error } = await supabase
                .from('whatsapp_messages')
                .update({
                  status: statusValue,
                  updated_at: new Date().toISOString(),
                })
                .eq('external_id', messageId);

              if (error) {
                console.error('[Meta Webhook] Error updating status:', error);
              }
            }
          }
        }
      }

      return new Response('OK', { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error('[Meta Webhook] Error processing webhook:', error);
      return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
});
