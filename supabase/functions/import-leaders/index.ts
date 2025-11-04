import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderImportData {
  nome_completo: string;
  whatsapp: string;
  regiao_administrativa: string;
  data_nascimento: string;
  endereco_completo: string;
  status: string;
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
function parseDate(dateInput: string | number): string {
  if (!dateInput) throw new Error('Data de nascimento é obrigatória');

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
function parseStatus(status: string): boolean {
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
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

    // Buscar todas as cidades uma vez
    const { data: cities } = await supabaseClient
      .from('office_cities')
      .select('id, nome, codigo_ra');

    const cityMap = new Map(
      cities?.map(c => [c.nome.toLowerCase().trim(), c.id]) || []
    );

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
        if (!leader.regiao_administrativa?.trim()) {
          throw new Error('Região Administrativa é obrigatória');
        }

        // Normalizar dados
        const telefone = normalizePhone(leader.whatsapp);
        const dataNascimento = parseDate(leader.data_nascimento);
        const isActive = parseStatus(leader.status);

        // Buscar cidade_id
        const cidadeNome = leader.regiao_administrativa.toLowerCase().trim();
        const cidadeId = cityMap.get(cidadeNome);

        if (!cidadeId) {
          throw new Error(`Região Administrativa "${leader.regiao_administrativa}" não encontrada`);
        }

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
              cidade_id: cidadeId,
              data_nascimento: dataNascimento,
              endereco_completo: leader.endereco_completo?.trim() || null,
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
              cidade_id: cidadeId,
              data_nascimento: dataNascimento,
              endereco_completo: leader.endereco_completo?.trim() || null,
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
          error: error.message,
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
