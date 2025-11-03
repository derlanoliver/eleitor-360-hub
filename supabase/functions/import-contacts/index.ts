import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactImport {
  nome: string;
  telefone: string;
  cidade: string;
  email?: string;
  endereco?: string;
  data_nascimento?: string;
  instagram?: string;
  facebook?: string;
  source_type: 'lider' | 'campanha' | 'evento' | 'afiliado' | 'manual';
  source_name: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  errors: Array<{ line: number; error: string }>;
}

function normalizeTelefone(telefone: string): string {
  // Remove tudo exceto números
  const digits = telefone.replace(/\D/g, '');
  
  // Formato E.164: +5561999999999
  if (digits.length === 11) {
    return `+55${digits}`;
  } else if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits}`;
  }
  
  throw new Error(`Telefone inválido: ${telefone}`);
}

function parseDataNascimento(data: string): string | null {
  if (!data) return null;
  
  // Formato DD/MM/AAAA -> AAAA-MM-DD
  const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Não autorizado');
    }

    // Verificar role (admin ou atendente)
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'atendente');
    if (!hasPermission) {
      throw new Error('Permissão negada');
    }

    const { contacts } = await req.json();
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('Nenhum contato fornecido');
    }

    if (contacts.length > 1000) {
      throw new Error('Máximo de 1000 contatos por importação');
    }

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
        if (!contact.nome || contact.nome.trim().length === 0) {
          throw new Error('Nome é obrigatório');
        }
        if (!contact.telefone) {
          throw new Error('Telefone é obrigatório');
        }
        if (!contact.cidade) {
          throw new Error('Cidade é obrigatória');
        }
        if (!contact.source_type) {
          throw new Error('Tipo de origem é obrigatório');
        }
        if (!contact.source_name) {
          throw new Error('Nome da origem é obrigatório');
        }

        // Normalizar telefone
        const telefone_norm = normalizeTelefone(contact.telefone);

        // Buscar cidade_id
        const { data: cidade } = await supabaseClient
          .from('office_cities')
          .select('id')
          .ilike('nome', contact.cidade)
          .single();

        if (!cidade) {
          throw new Error(`Cidade "${contact.cidade}" não encontrada`);
        }

        // Resolver source_id
        let source_id: string | null = null;
        let utm_source: string | null = null;
        let utm_medium: string | null = null;
        let utm_campaign: string | null = null;

        if (contact.source_type === 'lider') {
          const { data: lider } = await supabaseClient
            .from('lideres')
            .select('id')
            .ilike('nome_completo', contact.source_name)
            .single();

          if (!lider) {
            throw new Error(`Líder "${contact.source_name}" não encontrado`);
          }
          source_id = lider.id;

        } else if (contact.source_type === 'campanha') {
          const { data: campanha } = await supabaseClient
            .from('campaigns')
            .select('id, utm_source, utm_medium, utm_campaign')
            .eq('utm_campaign', contact.source_name)
            .single();

          if (!campanha) {
            throw new Error(`Campanha "${contact.source_name}" não encontrada`);
          }
          source_id = campanha.id;
          utm_source = campanha.utm_source;
          utm_medium = campanha.utm_medium;
          utm_campaign = campanha.utm_campaign;
        }

        // Verificar se contato já existe (por telefone)
        const { data: existingContact } = await supabaseClient
          .from('office_contacts')
          .select('id')
          .eq('telefone_norm', telefone_norm)
          .single();

        const contactData = {
          nome: contact.nome.trim(),
          telefone_norm,
          cidade_id: cidade.id,
          email: contact.email?.trim() || null,
          endereco: contact.endereco?.trim() || null,
          data_nascimento: parseDataNascimento(contact.data_nascimento || ''),
          instagram: contact.instagram?.trim() || null,
          facebook: contact.facebook?.trim() || null,
          source_type: contact.source_type,
          source_id,
          utm_source,
          utm_medium,
          utm_campaign,
        };

        if (existingContact) {
          // Atualizar contato existente
          const { error: updateError } = await supabaseClient
            .from('office_contacts')
            .update(contactData)
            .eq('id', existingContact.id);

          if (updateError) throw updateError;
          result.updated++;

        } else {
          // Inserir novo contato
          const { error: insertError } = await supabaseClient
            .from('office_contacts')
            .insert(contactData);

          if (insertError) throw insertError;
          result.inserted++;
        }

      } catch (error) {
        console.error(`Erro na linha ${lineNumber}:`, error);
        result.errors.push({
          line: lineNumber,
          error: error.message || 'Erro desconhecido',
        });
      }
    }

    result.success = result.errors.length === 0;

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
