import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderImportData {
  nome_completo: string;
  whatsapp: string;
  data_nascimento?: string;
  status?: string;
  observacao?: string;
  email?: string;
}

interface ImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: Array<{ line: number; error: string; data?: any }>;
  total: number;
}

/**
 * Normaliza telefone para formato E.164 (+55DDDNUMBER)
 */
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

/**
 * Converte data para formato YYYY-MM-DD
 */
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

    // Validar idade (16-120 anos)
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    if (age < 16 || age > 120) {
      throw new Error('Idade deve estar entre 16 e 120 anos');
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

/**
 * Converte status string para boolean
 */
function parseStatus(status?: string): boolean {
  if (!status) return true; // Padrão: ativo
  
  const normalized = status.toLowerCase().trim();
  if (normalized === 'ativo' || normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'inativo' || normalized === 'false' || normalized === '0') {
    return false;
  }
  throw new Error('Status deve ser "ativo" ou "inativo"');
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter o token de autorização do header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header presente:', !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRoles || userRoles.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem importar líderes.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { leaders } = await req.json();

    if (!Array.isArray(leaders) || leaders.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos. Envie um array de líderes.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (leaders.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Máximo de 500 líderes por importação.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ImportResult = {
      success: true,
      inserted: 0,
      updated: 0,
      errors: [],
      total: leaders.length,
    };

    // Processar cada líder
    for (let i = 0; i < leaders.length; i++) {
      const leader = leaders[i] as LeaderImportData;
      const lineNumber = i + 2; // +2 porque linha 1 é header

      try {
        // Validações básicas
        if (!leader.nome_completo?.trim()) {
          throw new Error('Nome completo é obrigatório');
        }
        if (!leader.whatsapp?.trim()) {
          throw new Error('WhatsApp é obrigatório');
        }

        // Normalizar dados
        const telefone = normalizePhone(leader.whatsapp);
        const dataNascimento = leader.data_nascimento ? parseDate(leader.data_nascimento) : null;
        const isActive = parseStatus(leader.status);

        // Verificar se líder já existe (por telefone)
        const { data: existingLeader } = await supabaseClient
          .from('lideres')
          .select('id, cadastros, pontuacao_total')
          .eq('telefone', telefone)
          .single();

        if (existingLeader) {
          // Atualizar líder existente (mantém cadastros e pontuação)
          const { error: updateError } = await supabaseClient
            .from('lideres')
            .update({
              nome_completo: leader.nome_completo.trim(),
              email: leader.email?.trim() || null,
              cidade_id: null, // Não vincular região na importação
              data_nascimento: dataNascimento,
              observacao: leader.observacao?.trim() || null,
              is_active: isActive,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLeader.id);

          if (updateError) throw updateError;
          result.updated++;
        } else {
          // Inserir novo líder
          const { error: insertError } = await supabaseClient
            .from('lideres')
            .insert({
              nome_completo: leader.nome_completo.trim(),
              telefone,
              email: leader.email?.trim() || null,
              cidade_id: null, // Não vincular região na importação
              data_nascimento: dataNascimento,
              observacao: leader.observacao?.trim() || null,
              is_active: isActive,
              status: 'active',
              cadastros: 0,
              pontuacao_total: 0,
            });

          if (insertError) throw insertError;
          result.inserted++;
        }
      } catch (error) {
        console.error(`Erro na linha ${lineNumber}:`, error);
        result.errors.push({
          line: lineNumber,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          data: leader,
        });
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
