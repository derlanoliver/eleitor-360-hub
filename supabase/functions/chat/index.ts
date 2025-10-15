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
  consultar_regioes: async (params: { limit?: number }) => {
    console.log('Executando consultar_regioes com params:', params);
    const query = supabase
      .from('regiao_administrativa')
      .select('id, ra, cadastros')
      .order('cadastros', { ascending: false });
    
    if (params.limit) query.limit(params.limit);
    
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao consultar regiões:', error);
      throw error;
    }
    console.log('Resultado consultar_regioes:', data);
    return data || [];
  },
  
  consultar_lideres: async (params: { limit?: number, cidade_id?: string }) => {
    console.log('Executando consultar_lideres com params:', params);
    let query = supabase
      .from('lideres')
      .select('id, nome_completo, email, telefone, cadastros, pontuacao_total, status')
      .eq('is_active', true)
      .order('pontuacao_total', { ascending: false });
    
    if (params.cidade_id) {
      query = query.eq('cidade_id', params.cidade_id);
    }
    
    if (params.limit) query.limit(params.limit);
    
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao consultar líderes:', error);
      throw error;
    }
    console.log('Resultado consultar_lideres:', data);
    return data || [];
  },
  
  consultar_temas: async (params: { limit?: number }) => {
    console.log('Executando consultar_temas com params:', params);
    const query = supabase
      .from('temas')
      .select('id, tema, cadastros')
      .order('cadastros', { ascending: false });
    
    if (params.limit) query.limit(params.limit);
    
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao consultar temas:', error);
      throw error;
    }
    console.log('Resultado consultar_temas:', data);
    return data || [];
  },
  
  consultar_perfil_demografico: async () => {
    console.log('Executando consultar_perfil_demografico');
    const { data, error } = await supabase
      .from('perfil_demografico')
      .select('id, genero, valor');
    
    if (error) {
      console.error('Erro ao consultar perfil:', error);
      throw error;
    }
    console.log('Resultado consultar_perfil_demografico:', data);
    return data || [];
  },

  consultar_cidades: async (params: { status?: string }) => {
    console.log('Executando consultar_cidades com params:', params);
    let query = supabase
      .from('office_cities')
      .select('id, nome, codigo_ra, status');
    
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Erro ao consultar cidades:', error);
      throw error;
    }
    console.log('Resultado consultar_cidades:', data);
    return data || [];
  }
};

const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'consultar_regioes',
      description: 'Consulta dados de cadastros por região administrativa (RA) do Distrito Federal. Retorna ranking de RAs por número de cadastros.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de resultados (padrão: 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_lideres',
      description: 'Consulta performance dos líderes comunitários. Retorna ranking por pontuação total e número de cadastros realizados.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de resultados (padrão: 10)'
          },
          cidade_id: {
            type: 'string',
            description: 'Filtrar por ID da cidade (opcional)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_temas',
      description: 'Consulta temas de interesse mais populares entre os cidadãos. Mostra quais pautas têm mais engajamento.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de resultados (padrão: 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_perfil_demografico',
      description: 'Consulta distribuição demográfica por gênero. Retorna percentuais de masculino e feminino.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_cidades',
      description: 'Consulta lista de cidades/regiões cadastradas no sistema com seus códigos de RA.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filtrar por status (active/inactive)'
          }
        }
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

async function streamOpenAI(messages: any[], apiKey: string, systemPrompt: string, useStreaming: boolean = true) {
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
      stream: useStreaming,
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
    const { messages, sessionId = 'default', userName = '' } = await req.json();
    
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

    console.log('Calling OpenAI API with', messages.length, 'messages for session:', sessionId);

    // Extrair primeiro nome do usuário
    const firstName = userName ? userName.split(' ')[0] : '';
    const userContext = firstName ? `\n👤 USUÁRIO: ${userName} (chame pelo primeiro nome "${firstName}" nas saudações e interações)` : '';

    // Prompt do sistema com personalidade do Deputado Rafael Prudente
    const systemPrompt = `Você é o assistente virtual do Deputado Rafael Prudente, um político comprometido com o desenvolvimento de Brasília e o bem-estar da população.

📅 DATA ATUAL: ${dataAtual} às ${horaAtual}
🆔 Session ID: ${sessionId}${userContext}

PERSONALIDADE E COMUNICAÇÃO:
- Seja amigável, próximo e acessível - como se estivesse conversando pessoalmente com um eleitor
- Use linguagem clara e direta, evitando jargões políticos quando possível
- Demonstre empatia e interesse genuíno pelas preocupações da comunidade
- Mantenha tom otimista mas realista sobre desafios e soluções
- Use emojis com moderação para humanizar a conversa (máximo 2-3 por resposta)
- Sempre enfatize o compromisso do Deputado Rafael Prudente com resultados concretos para a população

SUA FUNÇÃO:
- Analisar dados de campanhas (cadastros por região administrativa, coordenadores, temas/pautas, perfil demográfico)
- Fornecer insights estratégicos e recomendações baseadas em dados reais
- Responder perguntas sobre métricas e performance da campanha
- Sugerir ações táticas focadas no impacto positivo para a comunidade
- Representar os valores e compromissos do Deputado Rafael Prudente

DADOS DISPONÍVEIS:
Você tem acesso a funções que consultam dados em tempo real do banco de dados:

📊 **consultar_regioes**: Rankings de cadastros por Região Administrativa (RA)
  - Retorna: nome da RA e número de cadastros
  - Use para: "Quais as RAs com mais cadastros?", "Ranking de regiões"

👥 **consultar_lideres**: Performance dos líderes comunitários
  - Retorna: nome, email, telefone, cadastros, pontuação total
  - Use para: "Quem são os melhores líderes?", "Ranking de coordenadores"

💡 **consultar_temas**: Temas de interesse mais populares
  - Retorna: nome do tema e número de cadastros relacionados
  - Use para: "Quais pautas interessam mais?", "Temas em alta"

📈 **consultar_perfil_demografico**: Distribuição por gênero
  - Retorna: gênero e percentual
  - Use para: "Qual o perfil demográfico?", "Distribuição por gênero"

🏙️ **consultar_cidades**: Lista de cidades/RAs cadastradas
  - Retorna: nome, código RA, status
  - Use para: "Quais cidades estão cadastradas?"

**IMPORTANTE SOBRE QUERIES:**
- Sempre use os nomes EXATOS das funções acima
- Os dados são reais e atualizados do banco de dados
- Quando não houver dados, informe isso claramente ao usuário
- Apresente os números de forma clara e contextualizada

FORMATAÇÃO DAS RESPOSTAS:
- Use **negrito** para destacar informações importantes e números-chave
- Use *itálico* para ênfases sutis e observações
- Use \`código\` para dados técnicos ou específicos
- Organize informações em listas quando apropriado (• ou números)
- SEMPRE quebre parágrafos com linha dupla (\n\n) para melhor legibilidade
- Estruture respostas longas em seções claras com subtítulos
- Use emojis estratégicos: 🥇 🥈 🥉 para rankings, 📊 para dados, 💡 para insights

EXEMPLO DE BOA RESPOSTA:
"Olá! Ótima pergunta! Deixa eu consultar os dados mais recentes da nossa campanha. 🔍

**Top 3 Regiões Administrativas:**

🥇 **Ceilândia** - 412 cadastros
🥈 **Taguatinga** - 331 cadastros  
🥉 **Águas Claras** - 288 cadastros

**Insights importantes:**

Nossa região Oeste está apresentando um desempenho excepcional! Isso mostra que as pautas do Deputado Rafael Prudente têm ressonância forte nessas comunidades.

💡 *Recomendação:* Vamos reforçar a presença nessas regiões com eventos comunitários e intensificar a comunicação sobre os projetos já em andamento.

Quer que eu analise alguma região específica ou período em detalhe?"

IMPORTANTE:
- Sempre que precisar de dados atualizados, use as funções disponíveis
- Seja objetivo mas humano nas respostas
- Forneça insights acionáveis que beneficiem a comunidade
- Demonstre o compromisso do Deputado Rafael Prudente com transparência e resultados
- Lembre-se: cada consulta é uma oportunidade de mostrar nosso trabalho pela população de Brasília!
${firstName ? `- SEMPRE chame o usuário de "${firstName}" de forma natural e amigável nas suas respostas` : ''}`;

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
          
          // Validar resposta vazia
          if (!functionResponse || (Array.isArray(functionResponse) && functionResponse.length === 0)) {
            console.warn(`Função ${functionName} retornou dados vazios`);
            updatedMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ 
                data: [], 
                message: 'Nenhum dado encontrado' 
              })
            });
          } else {
            updatedMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResponse)
            });
          }
        } catch (error) {
          console.error(`Erro ao executar função ${functionName}:`, error);
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              details: error
            })
          });
        }
      }

      // Fazer nova chamada com os resultados das funções
      console.log('Fazendo segunda chamada com resultados das funções');
      try {
        const streamResponse = await streamOpenAI(updatedMessages, OPENAI_API_KEY, systemPrompt, true);
        
        return new Response(streamResponse.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error: any) {
        // Se falhar com streaming, tentar sem streaming
        if (error.message.includes('400')) {
          console.log('Erro com streaming, tentando sem streaming');
          const nonStreamResponse = await streamOpenAI(updatedMessages, OPENAI_API_KEY, systemPrompt, false);
          const data = await nonStreamResponse.json();
          
          return new Response(JSON.stringify(data), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }
        throw error;
      }
    } else {
      // Sem tool calls, fazer streaming direto
      console.log('Sem tool calls, fazendo streaming direto');
      try {
        const streamResponse = await streamOpenAI(messages, OPENAI_API_KEY, systemPrompt, true);
        
        return new Response(streamResponse.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error: any) {
        // Se falhar com streaming, tentar sem streaming
        if (error.message.includes('400')) {
          console.log('Erro com streaming, tentando sem streaming');
          const nonStreamResponse = await streamOpenAI(messages, OPENAI_API_KEY, systemPrompt, false);
          const data = await nonStreamResponse.json();
          
          return new Response(JSON.stringify(data), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }
        throw error;
      }
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
