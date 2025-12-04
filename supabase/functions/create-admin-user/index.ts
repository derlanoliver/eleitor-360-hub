import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapear role para label amigável
const roleLabels: Record<string, string> = {
  'super_admin': 'Super Administrador',
  'admin': 'Administrador',
  'atendente': 'Atendente',
  'checkin_operator': 'Operador de Check-in'
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

    const { email, password, name, role = 'admin', phone } = await req.json();

    console.log('Creating admin user:', { email, name, role });

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

    // Aguardar um pouco para o trigger executar
    await new Promise(resolve => setTimeout(resolve, 500));

    // Garantir que o perfil existe (upsert como fallback do trigger)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        name: name,
        role: role,
        telefone: phone || null
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.error('Profile upsert error:', profileError);
    } else {
      console.log('Profile ensured:', profile);
    }

    // Create user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: role
      }, { onConflict: 'user_id, role' });

    if (roleError) {
      console.error('Role creation error:', roleError);
    } else {
      console.log('Role created successfully:', role);
    }

    // Preparar variáveis para os templates
    const templateVariables = {
      nome: name,
      email: email,
      senha: password,
      nivel: roleLabels[role] || role,
      link_plataforma: 'https://app.rafaelprudente.com'
    };

    // Enviar Email de boas-vindas
    let emailSent = false;
    try {
      console.log('Sending welcome email to:', email);
      
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        },
        body: JSON.stringify({
          templateSlug: 'membro-cadastro-boas-vindas',
          to: email,
          toName: name,
          variables: templateVariables
        })
      });
      
      const emailResult = await emailResponse.json();
      console.log('Email response:', emailResult);
      emailSent = emailResponse.ok;
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    // Enviar WhatsApp de boas-vindas (se telefone informado)
    let whatsappSent = false;
    if (phone) {
      try {
        console.log('Sending welcome WhatsApp to:', phone);
        
        const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceRoleKey}`
          },
          body: JSON.stringify({
            phone: phone,
            templateSlug: 'membro-cadastro-boas-vindas',
            variables: templateVariables
          })
        });
        
        const whatsappResult = await whatsappResponse.json();
        console.log('WhatsApp response:', whatsappResult);
        whatsappSent = whatsappResponse.ok;
      } catch (whatsappError) {
        console.error('Error sending welcome WhatsApp:', whatsappError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        profile,
        notifications: {
          emailSent,
          whatsappSent
        }
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
