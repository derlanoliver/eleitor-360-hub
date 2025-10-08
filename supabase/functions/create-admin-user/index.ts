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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, password, name, role = 'admin', tenantId = null } = await req.json();

    // Validação: super_admin só pode ser criado com domínio @eleitor360.ai
    if (role === 'super_admin' && !email.endsWith('@eleitor360.ai')) {
      console.error('Tentativa de criar super_admin com domínio inválido:', email);
      throw new Error('Super Admin só pode ser criado com e-mail @eleitor360.ai');
    }

    console.log('Creating admin user:', { email, name, role, tenantId });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('User created in auth:', authData.user.id);

    // The profile will be automatically created by the handle_new_user trigger
    // Wait a bit for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify profile was created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile check error:', profileError);
    } else {
      console.log('Profile created successfully:', profile);
    }

    // Insert role into user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role,
        tenant_id: tenantId // NULL for global roles (super_admin, super_user)
      });

    if (roleError) {
      console.error('Error inserting user role:', roleError);
      throw roleError;
    }

    console.log('User role inserted successfully:', { userId: authData.user.id, role, tenantId });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        profile 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating admin user:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
