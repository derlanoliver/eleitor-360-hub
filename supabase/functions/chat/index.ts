import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inicializar cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Funções disponíveis para o agente IA
const availableFunctions: Record<string, (params: any) => Promise<any>> = {
  consultar_regioes: async (params: { periodo?: string, limit?: number }) => {
    console.log('Executando consultar_regioes com params:', params);
    const query = supabase
      .from('cadastros_ra')
      .select('*')
      .order('cadastros', { ascending: false });
    
    if (params.limit) query.limit(params.limit);
    
    const { data, error } = await query;
    if (error) throw error;
    console.log('Resultado consultar_regioes:', data);
    return data;
  },
  
  consultar_coordenadores: async (params: { limit?: number }) => {
    console.log('Executando consultar_coordenadores com params:', params);
    const query = supabase
      .from('coordenadores')
      .select('*')
      .order('cadastros', { ascending: false });
    
    if (params.limit) query.limit(params.limit);
    
    const { data, error } = await query;
    if (error) throw error;
    console.log('Resultado consultar_coordenadores:', data);
    return data;
  },
  
  consultar_temas: async (params: { limit?: number }) => {
    console.log('Executando consultar_temas com params:', params);
    const query = supabase
      .from('temas_interesse')
      .select('*')
      .order('cadastros', { ascending: false });
    
    if (params.limit) query.limit(params.limit);
    
    const { data, error } = await query;
    if (error) throw error;
    console.log('Resultado consultar_temas:', data);
    return data;
  },
  
  consultar_perfil_demografico: async () => {
    console.log('Executando consultar_perfil_demografico');
    const { data, error } = await supabase
      .from('perfil_demografico')
      .select('*');
    
    if (error) throw error;
    console.log('Resultado consultar_perfil_demografico:', data);
    return data;
  }
};

const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'consultar_regioes',
      description: 'Consulta dados de cadastros por região administrativa (RA). Use para responder perguntas sobre performance regional, cidades com mais cadastros, etc.',
      parameters: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Período para filtro (ex: "mes_atual", "ultimos_30_dias")'
          },
          limit: {
            type: 'number',
            description: 'Número máximo de resultados a retornar'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_coordenadores',
      description: 'Consulta performance dos coordenadores de campanha. Use para responder sobre rankings de coordenadores, quem está trazendo mais cadastros, etc.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de resultados a retornar'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_temas',
      description: 'Consulta temas de interesse mais populares entre os eleitores. Use para entender quais pautas estão gerando mais engajamento.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de resultados a retornar'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_perfil_demografico',
      description: 'Consulta dados demográficos dos eleitores (gênero, idade média, etc). Use para análises de perfil do eleitorado.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

async function callOpenAI(messages: any[], apiKey: string, systemPrompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_completion_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return await response.json();
}

async function streamOpenAI(messages: any[], apiKey: string, systemPrompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_completion_tokens: 2000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não está configurada');
    }

    // Data e hora atual para contexto
    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const horaAtual = now.toLocaleTimeString('pt-BR');

    console.log('Calling OpenAI API with', messages.length, 'messages');

    // Prompt do sistema mais amigável e contextualizado
    const systemPrompt = `Olá! Você é um assistente de IA especializado em análise de dados políticos e gestão de campanhas. 

📅 DATA ATUAL: ${dataAtual} às ${horaAtual}

PERSONALIDADE:
- Seja amigável, descontraído mas profissional ao mesmo tempo
- Use emojis quando apropriado para deixar a conversa mais leve
- Seja direto e objetivo nas respostas
- Mostre entusiasmo ao apresentar insights interessantes
- Use linguagem brasileira natural e informal (você pode usar gírias leves)

CAPACIDADES:
Você tem acesso a dados em tempo real de uma campanha política através de funções:
- consultar_regioes: Rankings de cadastros por região administrativa
- consultar_coordenadores: Performance dos coordenadores
- consultar_temas: Temas de interesse mais populares
- consultar_perfil_demografico: Dados demográficos dos eleitores

FORMATO DAS RESPOSTAS:
- Use marcadores e numeração para organizar informações
- Destaque números importantes com **negrito**
- Use emojis para rankings: 🥇 🥈 🥉
- Sempre forneça insights acionáveis após os dados
- Faça perguntas de acompanhamento relevantes
- Quando apresentar dados, sempre contextualize com a data atual

EXEMPLO DE BOA RESPOSTA:
"Opa! Deixa eu dar uma olhada nos dados mais recentes pra você! 🔍

Baseado nos números atualizados, aqui estão os destaques:

🥇 **Ceilândia** - 412 cadastros (líder absoluto!)
🥈 **Taguatinga** - 331 cadastros
🥉 **Águas Claras** - 288 cadastros

**Insights importantes:**
- Região Oeste está muito forte!
- O top 3 representa quase metade dos cadastros

Quer que eu analise algum período específico ou região?"

Lembre-se: você está aqui para ajudar a tomar decisões estratégicas com base em dados!`;

    // Primeira chamada para verificar se há tool calls
    const initialResponse = await callOpenAI(messages, OPENAI_API_KEY, systemPrompt);
    
    console.log('Initial response:', JSON.stringify(initialResponse, null, 2));

    // Verificar se há tool calls na resposta
    const toolCalls = initialResponse.choices[0]?.message?.tool_calls;
    
    if (toolCalls && toolCalls.length > 0) {
      console.log('Tool calls detectados:', toolCalls.length);
      
      // Adicionar a mensagem do assistente com tool calls ao histórico
      const updatedMessages = [
        ...messages,
        initialResponse.choices[0].message
      ];

      // Executar cada tool call
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executando função: ${functionName}`, functionArgs);

        try {
          const functionToCall = availableFunctions[functionName];
          if (!functionToCall) {
            throw new Error(`Função ${functionName} não encontrada`);
          }

          const functionResponse = await functionToCall(functionArgs);
          
          // Adicionar resultado da função ao histórico
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResponse)
          });
        } catch (error) {
          console.error(`Erro ao executar função ${functionName}:`, error);
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' })
          });
        }
      }

      // Fazer nova chamada com os resultados das funções (com streaming)
      console.log('Fazendo segunda chamada com resultados das funções');
      const streamResponse = await streamOpenAI(updatedMessages, OPENAI_API_KEY, systemPrompt);
      
      return new Response(streamResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Sem tool calls, fazer streaming direto
      console.log('Sem tool calls, fazendo streaming direto');
      const streamResponse = await streamOpenAI(messages, OPENAI_API_KEY, systemPrompt);
      
      return new Response(streamResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

  } catch (error) {
    console.error('Error in chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
