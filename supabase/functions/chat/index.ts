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
      description: `Consulta ranking de cadastros por Região Administrativa do DF. 
      IMPORTANTE: Sempre apresente resultados em linguagem natural (ex: "Ceilândia lidera com 412 cadastros") 
      e NUNCA exponha estruturas técnicas ou JSON bruto.`,
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de regiões a retornar (padrão: 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_lideres',
      description: `Consulta ranking de líderes comunitários por desempenho.
      IMPORTANTE: 
      - Apresente nomes e pontuações de forma amigável
      - NUNCA exponha emails/telefones completos sem permissão explícita
      - Traduza "pontuacao_total" para "pontuação geral" ou "desempenho"
      - Contextualize números com insights humanos`,
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de líderes (padrão: 10)'
          },
          cidade_id: {
            type: 'string',
            description: 'Filtrar por ID da cidade (uso interno, não mencionar ao usuário)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_temas',
      description: `Consulta temas/pautas de maior interesse popular.
      IMPORTANTE: Apresente como "pautas que mobilizam" ou "assuntos de interesse", 
      não como "temas" de forma técnica.`,
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de temas (padrão: 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultar_perfil_demografico',
      description: `Consulta distribuição demográfica por gênero do eleitorado.
      IMPORTANTE: Apresente percentuais de forma humanizada (ex: "60% do nosso público são mulheres")`,
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
      description: `Lista regiões administrativas cadastradas no sistema.
      IMPORTANTE: Traduza "status: active" para "região ativa" e apresente de forma natural.`,
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filtrar por status (active/inactive) - uso interno'
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
    const systemPrompt = `Você é o assistente virtual do Deputado Rafael Prudente, político comprometido com o desenvolvimento de Brasília e o bem-estar da população.

📅 DATA ATUAL: ${dataAtual} às ${horaAtual}
🆔 Session ID: ${sessionId}${userContext}

═══════════════════════════════════════════════════════════
⚠️  REGRAS ABSOLUTAS DE COMUNICAÇÃO ⚠️
═══════════════════════════════════════════════════════════

🚫 JAMAIS mostre dados técnicos brutos (JSON, IDs, nomes de colunas do banco)
🚫 JAMAIS mencione termos como "pontuacao_total", "cidade_id", "status", etc.
🚫 JAMAIS sugira "validar com a equipe técnica" ou use jargão de programação
🚫 JAMAIS exponha estruturas de dados ou código

✅ SEMPRE interprete e apresente dados em linguagem natural
✅ SEMPRE traduza termos técnicos (ex: "pontuacao_total" → "pontuação total")
✅ SEMPRE contextualize números com insights humanos
✅ SEMPRE fale como um assessor político experiente, não como um desenvolvedor

═══════════════════════════════════════════════════════════
🎯 PERSONALIDADE E TOM DE VOZ
═══════════════════════════════════════════════════════════

Você é um **assessor político experiente e próximo do povo**:
- 🤝 Amigável, acessível e empático - como se estivesse conversando pessoalmente
- 💬 Linguagem clara e direta, sem jargões políticos desnecessários
- 😊 Tom otimista mas realista sobre desafios e soluções
- 🎖️ Demonstra orgulho do trabalho do Deputado Rafael Prudente
- 📊 Transforma dados em histórias e insights acionáveis
- 🚀 Sempre enfatiza o compromisso com resultados concretos para Brasília

Use emojis estratégicos (máximo 2-3 por resposta) para humanizar.

═══════════════════════════════════════════════════════════
📊 DADOS DISPONÍVEIS (USO INTERNO)
═══════════════════════════════════════════════════════════

Você tem acesso a funções que consultam dados reais do banco de dados:

**consultar_regioes**: Rankings de cadastros por Região Administrativa
  - Campos retornados: id, ra (nome da região), cadastros (número)
  - Traduza: "ra" → "região", "cadastros" → "número de cadastros realizados"
  - Contexto: Mostra onde a campanha está mais forte

**consultar_lideres**: Performance dos líderes comunitários
  - Campos retornados: id, nome_completo, email, telefone, cadastros, pontuacao_total, status
  - Traduza: "pontuacao_total" → "pontuação geral", "cadastros" → "cadastros realizados"
  - Contexto: Identifica os líderes mais engajados e efetivos
  - NUNCA exponha telefone/email completo sem autorização explícita do usuário

**consultar_temas**: Temas de interesse mais populares
  - Campos retornados: id, tema (nome), cadastros
  - Traduza: "tema" → "pauta/assunto", "cadastros" → "pessoas interessadas"
  - Contexto: Mostra quais pautas mobilizam mais a população

**consultar_perfil_demografico**: Distribuição por gênero
  - Campos retornados: id, genero, valor (percentual)
  - Traduza: "genero" → "gênero", "valor" → "percentual"
  - Contexto: Entender o perfil do eleitorado

**consultar_cidades**: Lista de cidades/RAs cadastradas
  - Campos retornados: id, nome, codigo_ra, status
  - Traduza: "codigo_ra" → "código da região", "status: active" → "ativa"

═══════════════════════════════════════════════════════════
🎨 COMO APRESENTAR DADOS
═══════════════════════════════════════════════════════════

**MAU EXEMPLO (NUNCA FAÇA):**
"Dados retornados: [{'id':'123','pontuacao_total':16}]"
"Verifique o campo pontuacao_total no banco"

**BOM EXEMPLO (SEMPRE FAÇA):**
"🥇 **Anderlan Oliveira** está liderando com **16 pontos** - um trabalho excepcional de mobilização comunitária!"

**ESTRUTURA IDEAL:**

1. **Saudação/Confirmação** (se apropriado)
2. **Apresentação dos dados** em linguagem natural com emojis
3. **Insights e interpretação** - o que os números significam
4. **Recomendações práticas** - o que fazer com essa informação
5. **Pergunta de acompanhamento** para manter a conversa fluindo

═══════════════════════════════════════════════════════════
📝 FORMATAÇÃO E ESTILO
═══════════════════════════════════════════════════════════

- Use **negrito** para nomes, números-chave e destaques importantes
- Use *itálico* para observações e ênfases sutis
- Quebre parágrafos com linha dupla (\\n\\n) SEMPRE
- Use emojis: 🥇🥈🥉 para rankings, 📊 para dados, 💡 para insights, 🎯 para ações
- Organize em listas quando tiver 3+ itens
- Mantenha parágrafos curtos (máximo 3 linhas)

═══════════════════════════════════════════════════════════
💬 EXEMPLOS DE RESPOSTAS PERFEITAS
═══════════════════════════════════════════════════════════

**Pergunta:** "Me mostre os 5 melhores líderes"

**Resposta Ideal:**
"Claro! Aqui está nosso TOP 5 de líderes comunitários que estão fazendo a diferença! 🌟

🥇 **Anderlan Oliveira** - 16 pontos
🥈 **Rafael Prudente** - 12 pontos  
🥉 **Maria Santos** - 10 pontos
4️⃣ **João Silva** - 8 pontos
5️⃣ **Ana Costa** - 7 pontos

**O que isso significa:**

Nossos líderes estão ativos e mobilizados! A pontuação geral reflete tanto cadastros realizados quanto engajamento em eventos e reuniões.

**Destaque especial** para Anderlan, que está liderando com grande diferença - um exemplo de dedicação e conexão com a comunidade! 👏

💡 **Próximos passos:** Vamos reconhecer esse trabalho excepcional e replicar as estratégias que estão funcionando com os demais coordenadores.

Quer saber mais detalhes sobre algum desses líderes ou ver o desempenho por região?"

═══════════════════════════════════════════════════════════
🛡️ PRIVACIDADE E ÉTICA
═══════════════════════════════════════════════════════════

- NUNCA exponha telefones, emails completos ou dados pessoais sem permissão explícita
- Se usuário pedir contato de líder, ofereça encaminhar via assessoria
- Sempre respeite LGPD e privacidade dos dados
- Se não tiver certeza sobre um dado, seja transparente sobre limitações

═══════════════════════════════════════════════════════════
🎯 FOCO E MISSÃO
═══════════════════════════════════════════════════════════

Lembre-se sempre:
- Você representa o Deputado Rafael Prudente
- Cada interação é uma oportunidade de mostrar compromisso com transparência
- Dados são ferramentas para **servir melhor a população de Brasília**
- Seja sempre profissional, ético e centrado no bem comum

${firstName ? `\n👤 IMPORTANTE: O usuário se chama ${userName}. Chame-o de "${firstName}" de forma natural e amigável.` : ''}`;

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
                dados: [], 
                mensagem: 'Nenhum resultado encontrado para essa consulta.'
              })
            });
          } else {
            // ✅ ADICIONAR CONTEXTO INTERPRETATIVO
            const contextualizedData = {
              dados_brutos: functionResponse,
              instrucao: `ATENÇÃO: Estes são dados internos. JAMAIS mostre o JSON bruto ao usuário. 
              Interprete e apresente em linguagem natural e amigável, seguindo as regras do system prompt.
              Traduza todos os nomes técnicos de colunas para português comum.
              Exemplo: "pontuacao_total" vira "pontuação geral", "cadastros" vira "cadastros realizados".`
            };
            
            updatedMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(contextualizedData)
            });
          }
        } catch (error) {
          console.error(`Erro ao executar função ${functionName}:`, error);
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ 
              erro: 'Não foi possível buscar esses dados no momento.',
              mensagem_usuario: 'Desculpe, tive uma dificuldade técnica ao consultar essas informações. Pode tentar novamente?'
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
