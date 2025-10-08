import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    // Create admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const { email, password, name, role, tenantId } = await req.json();
    
    console.log('[CREATE-USER] START', { 
      email, 
      role, 
      tenantId: tenantId || 'NULL (global role)',
      timestamp: new Date().toISOString() 
    });
    
    // Security check: only allow super_admin creation with specific domain
    if (role === 'super_admin' && !email.endsWith('@eleitor360.ai')) {
      return new Response(
        JSON.stringify({ 
          errorCode: 'INVALID_DOMAIN',
          message: 'super_admin role can only be assigned to @eleitor360.ai emails' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing user (query auth.users via admin API)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuth = existingUsers?.users?.find((u: any) => u.email === email);

    if (existingAuth) {
      console.log('[CREATE-USER] USER-EXISTS', { email, userId: existingAuth.id });
      
      // Check if profile exists
      const emailDomain = email.split('@')[1];
      const isPlatformAdmin = emailDomain === 'eleitor360.ai';
      
      let profileExists = false;
      if (isPlatformAdmin) {
        const { data: platformProfile } = await supabaseAdmin
          .from('platform_admins')
          .select('id')
          .eq('id', existingAuth.id)
          .maybeSingle();
        profileExists = !!platformProfile;
      } else {
        const { data: tenantProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', existingAuth.id)
          .maybeSingle();
        profileExists = !!tenantProfile;
      }
      
      if (!profileExists) {
        // Orphaned user detected
        console.warn('[CREATE-USER] ORPHAN-DETECTED', { email, userId: existingAuth.id });
        await supabaseAdmin.auth.admin.deleteUser(existingAuth.id);
        console.log('[CREATE-USER] ORPHAN-DELETED', { email, userId: existingAuth.id });
      } else {
        // User fully exists
        return new Response(JSON.stringify({
          errorCode: 'EMAIL_EXISTS',
          message: `Usuário ${email} já existe no sistema`,
          details: { email, role, existingUser: true },
          timestamp: new Date().toISOString()
        }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        tenant_id: tenantId
      }
    });

    if (authError) {
      console.error('[CREATE-USER] AUTH-ERROR', {
        stage: 'auth.admin.createUser',
        errorCode: authError.code,
        status: authError.status,
        message: authError.message,
        email,
        role
      });
      
      if (authError.status === 422 && authError.message?.includes('already')) {
        return new Response(JSON.stringify({
          errorCode: 'EMAIL_EXISTS',
          message: `Usuário ${email} já existe no sistema`,
          details: { email, role, existingUser: true },
          timestamp: new Date().toISOString()
        }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      return new Response(
        JSON.stringify({ 
          errorCode: 'AUTH_ERROR',
          message: authError.message,
          details: { email, role, stage: 'auth_creation' }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CREATE-USER] AUTH-SUCCESS', { 
      userId: authData.user.id, 
      email,
      metadata: authData.user.user_metadata 
    });

    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify profile was created
    const emailDomain = email.split('@')[1];
    const isPlatformAdmin = emailDomain === 'eleitor360.ai';
    
    let profile = null;
    let profileError = null;
    
    if (isPlatformAdmin) {
      const result = await supabaseAdmin
        .from('platform_admins')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      profile = result.data;
      profileError = result.error;
    } else {
      const result = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      profile = result.data;
      profileError = result.error;
    }

    if (profileError || !profile) {
      console.error('[CREATE-USER] PROFILE-ERROR', {
        stage: 'profile_verification',
        userId: authData.user.id,
        email,
        role,
        tenantId,
        isPlatformAdmin,
        profileError: profileError?.message,
        profileExists: !!profile
      });
    } else {
      console.log('[CREATE-USER] PROFILE-SUCCESS', { 
        profileId: profile.id, 
        tenantId: profile.tenant_id || 'NULL (platform admin)',
        role: profile.role,
        table: isPlatformAdmin ? 'platform_admins' : 'profiles'
      });
    }

    // Insert role in user_roles
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role as any,
        tenant_id: tenantId || null
      });

    if (roleError) {
      console.error('[CREATE-USER] ROLE-INSERT-ERROR', {
        stage: 'user_roles_insert',
        userId: authData.user.id,
        role,
        tenantId,
        error: roleError.message
      });
      return new Response(
        JSON.stringify({ 
          errorCode: 'ROLE_ERROR',
          message: 'Failed to assign role: ' + roleError.message,
          details: { email, role, stage: 'role_assignment' }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CREATE-USER] COMPLETE', { 
      userId: authData.user.id, 
      email, 
      role, 
      tenantId,
      isPlatformAdmin,
      success: true 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        profile 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[CREATE-USER] UNEXPECTED-ERROR', {
      stage: 'catch_block',
      error: error?.message || 'Unknown error',
      stack: error?.stack
    });
    
    return new Response(
      JSON.stringify({ 
        errorCode: 'UNEXPECTED_ERROR',
        message: error?.message || 'Unknown error',
        details: { stage: 'unknown' },
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
