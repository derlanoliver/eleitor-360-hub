import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactImport {
  nome_completo: string;
  whatsapp: string;
  data_nascimento: string;
  endereco: string;
  observacao?: string;
  cidade?: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  errors: Array<{ line: number; error: string }>;
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  
  throw new Error('Telefone deve ter 13 dígitos (DDIDDDNÚMERO) ou 11 dígitos (DDDNÚMERO)');
}

function parseDate(dateInput?: string | number): string | null {
  if (!dateInput) return null;

  try {
    let date: Date;

    // Se for número (timestamp Excel)
    if (typeof dateInput === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      date = new Date(excelEpoch.getTime() + dateInput * 86400000);
    } else {
      const dateStr = String(dateInput).trim();
      
      // DD/MM/YYYY ou DD-MM-YYYY
      const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      // YYYY-MM-DD ou YYYY/MM/DD
      else if (dateStr.match(/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/)) {
        date = new Date(dateStr);
      } else {
        date = new Date(dateStr);
      }
    }

    if (isNaN(date.getTime())) {
      throw new Error('Data inválida');
    }

    // Formatar YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    throw new Error(`Erro ao processar data: ${error}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header presente:', !!authHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair o token JWT do header "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extraído, comprimento:', token.length);

    // Cliente para autenticação (ANON_KEY)
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar autenticação passando o token explicitamente
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User ID autenticado:', user.id);

    // Cliente para operações no banco (SERVICE_ROLE_KEY)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se usuário tem role admin ou atendente
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Role do usuário:', userRoles?.role);

    if (!userRoles || !['admin', 'atendente'].includes(userRoles.role)) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autorizado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contacts } = await req.json();
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum contato fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (contacts.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Máximo de 1000 contatos por importação' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Iniciando importação de ${contacts.length} contatos`);

    const result: ImportResult = {
      success: true,
      total: contacts.length,
      inserted: 0,
      updated: 0,
      errors: [],
    };

    // Processar cada contato
    for (let i = 0; i < contacts.length; i++) {
      const contact: ContactImport = contacts[i];
      const lineNumber = i + 2; // +2 porque linha 1 é cabeçalho

      try {
        // Validações básicas
        if (!contact.nome_completo || contact.nome_completo.trim().length === 0) {
          throw new Error('Nome completo é obrigatório');
        }
        if (!contact.whatsapp) {
          throw new Error('WhatsApp é obrigatório');
        }
        if (!contact.data_nascimento) {
          throw new Error('Data de nascimento é obrigatória');
        }
        if (!contact.endereco || contact.endereco.trim().length === 0) {
          throw new Error('Endereço é obrigatório');
        }

        // Normalizar telefone
        const telefone_norm = normalizePhone(contact.whatsapp);

        // Buscar ou criar cidade_id (opcional - usar padrão se não fornecido)
        let cidade_id: string | null = null;

        if (contact.cidade) {
          const { data: cidade } = await supabaseClient
            .from('office_cities')
            .select('id')
            .ilike('nome', contact.cidade)
            .single();

          if (cidade) {
            cidade_id = cidade.id;
          }
        }

        // Se não encontrou cidade, usar primeira cidade ativa como fallback
        if (!cidade_id) {
          const { data: cidadePadrao } = await supabaseClient
            .from('office_cities')
            .select('id')
            .eq('status', 'active')
            .limit(1)
            .single();
          
          cidade_id = cidadePadrao?.id || null;
        }

        if (!cidade_id) {
          throw new Error('Nenhuma cidade disponível no sistema');
        }

        // Preparar dados do contato
        const contactData = {
          nome: contact.nome_completo.trim(),
          telefone_norm,
          cidade_id,
          endereco: contact.endereco.trim(),
          data_nascimento: parseDate(contact.data_nascimento),
          source_type: 'manual',
          source_id: null,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_content: contact.observacao?.trim() || null,
        };

        // Verificar se contato já existe (por telefone)
        const { data: existingContact } = await supabaseClient
          .from('office_contacts')
          .select('id')
          .eq('telefone_norm', telefone_norm)
          .single();

        if (existingContact) {
          // Atualizar contato existente (mantém created_at original)
          const { error: updateError } = await supabaseClient
            .from('office_contacts')
            .update(contactData)
            .eq('id', existingContact.id);

          if (updateError) throw updateError;
          result.updated++;
          console.log(`Contato ${lineNumber} atualizado: ${contact.nome_completo}`);
        } else {
          // Inserir novo contato (created_at é gerado automaticamente pelo DB)
          const { error: insertError } = await supabaseClient
            .from('office_contacts')
            .insert(contactData);

          if (insertError) throw insertError;
          result.inserted++;
          console.log(`Contato ${lineNumber} inserido: ${contact.nome_completo}`);
        }

      } catch (error) {
        console.error(`Erro na linha ${lineNumber}:`, error);
        result.errors.push({
          line: lineNumber,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    result.success = result.errors.length === 0;

    console.log('Importação concluída:', {
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors.length,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
