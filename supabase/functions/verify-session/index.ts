import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken } = await req.json();

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Token de sessão é obrigatório', valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session with user data
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*, admin_users(*)')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      console.log('Session not found or inactive');
      return new Response(
        JSON.stringify({ valid: false, error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now > expiresAt) {
      console.log('Session expired');
      
      // Mark session as inactive
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', session.id);

      return new Response(
        JSON.stringify({ valid: false, error: 'Sessão expirada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    const user = Array.isArray(session.admin_users) ? session.admin_users[0] : session.admin_users;

    return new Response(
      JSON.stringify({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        expiresAt: session.expires_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Session verification error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Erro ao verificar sessão' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
