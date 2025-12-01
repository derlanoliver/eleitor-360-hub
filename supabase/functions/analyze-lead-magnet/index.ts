import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error("No file provided");
    }

    console.log(`Analyzing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    let extractedText = "";
    const fileType = file.name.toLowerCase();

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Extract text based on file type
    if (fileType.endsWith('.pdf')) {
      // For PDFs, we'll extract what we can from the raw bytes
      // This is a simplified approach - we look for text streams
      const decoder = new TextDecoder('latin1');
      const rawText = decoder.decode(bytes);
      
      // Extract text between stream/endstream markers (simplified PDF text extraction)
      const streamMatches = rawText.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
      if (streamMatches) {
        extractedText = streamMatches
          .map(s => s.replace(/stream[\r\n]+/, '').replace(/[\r\n]+endstream/, ''))
          .filter(s => /[a-zA-Z]{3,}/.test(s)) // Only keep streams with readable text
          .join(' ')
          .replace(/[^\x20-\x7E\s]/g, ' ') // Remove non-printable chars
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000);
      }
      
      // If no text extracted, use filename and metadata hints
      if (!extractedText || extractedText.length < 100) {
        extractedText = `Documento PDF: ${file.name.replace('.pdf', '')}. Tamanho: ${Math.round(file.size / 1024)}KB`;
      }
    } else if (fileType.endsWith('.csv')) {
      // Parse CSV
      const decoder = new TextDecoder('utf-8');
      const csvText = decoder.decode(bytes);
      const lines = csvText.split('\n').slice(0, 50); // First 50 lines
      const headers = lines[0] || '';
      const sampleRows = lines.slice(1, 6).join('\n');
      extractedText = `Planilha CSV:\nColunas: ${headers}\nDados de exemplo:\n${sampleRows}`;
    } else if (fileType.endsWith('.xlsx') || fileType.endsWith('.xls')) {
      // For Excel files, we'll try to extract strings from the raw content
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(bytes);
      
      // Look for shared strings (common in xlsx)
      const stringMatches = rawText.match(/<t[^>]*>([^<]+)<\/t>/g);
      if (stringMatches) {
        const strings = stringMatches
          .map(s => s.replace(/<[^>]+>/g, ''))
          .filter(s => s.length > 2)
          .slice(0, 200);
        extractedText = `Planilha Excel: ${file.name}\nConteúdo encontrado:\n${strings.join(', ').substring(0, 5000)}`;
      } else {
        extractedText = `Planilha Excel: ${file.name}. Tamanho: ${Math.round(file.size / 1024)}KB`;
      }
    } else {
      // Try plain text
      const decoder = new TextDecoder('utf-8');
      extractedText = decoder.decode(bytes).substring(0, 8000);
    }

    console.log(`Extracted ${extractedText.length} chars from file`);

    // Generate AI suggestions using Lovable AI
    const aiPrompt = `Você é um especialista em copywriting e marketing digital brasileiro.

Analise este conteúdo de um material digital (e-book, planilha, guia) e gere textos persuasivos em português brasileiro para uma landing page de captação de leads.

CONTEÚDO DO MATERIAL:
${extractedText}

NOME DO ARQUIVO: ${file.name}

Gere um JSON com as seguintes propriedades:
1. nome: Nome interno do funil (3-5 palavras descritivas)
2. lead_magnet_nome: Nome atrativo do material com formato (Ex: "E-book: Título Chamativo")
3. titulo: Headline principal da landing (máx 60 caracteres, gere curiosidade e desejo)
4. subtitulo: Subheadline que complementa e reforça benefícios (máx 120 caracteres)
5. descricao: Descrição interna do funil para equipe (máx 200 caracteres)
6. texto_botao: CTA do formulário (máx 25 caracteres, verbo de ação, crie urgência)
7. obrigado_titulo: Título pós-cadastro celebratório (máx 50 caracteres, use emoji)
8. obrigado_subtitulo: Texto de reforço e próximos passos (máx 120 caracteres)
9. obrigado_texto_botao: CTA do botão de download (máx 30 caracteres)

REGRAS IMPORTANTES:
- Use linguagem persuasiva e direta
- Foque em benefícios e transformação, não características
- Crie urgência sem ser agressivo
- Adapte ao contexto brasileiro
- Use emojis estratégicos no título de obrigado
- Se não conseguir extrair muito conteúdo, seja criativo baseado no nome do arquivo

Responda APENAS com o JSON válido, sem markdown ou explicações.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um copywriter expert brasileiro. Responda apenas com JSON válido." },
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro ao processar com IA");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty AI response");
    }

    console.log("AI response:", content);

    // Parse AI response - handle potential markdown code blocks
    let suggestions;
    try {
      let jsonStr = content.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      suggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Provide fallback suggestions based on filename
      const baseName = file.name.replace(/\.(pdf|xlsx?|csv)$/i, '').replace(/[-_]/g, ' ');
      suggestions = {
        nome: `Funil ${baseName}`,
        lead_magnet_nome: `Material: ${baseName}`,
        titulo: `Acesse seu ${baseName} Gratuitamente`,
        subtitulo: "Preencha o formulário e receba o material no seu e-mail",
        descricao: `Funil de captação para ${baseName}`,
        texto_botao: "Quero Receber!",
        obrigado_titulo: "🎉 Parabéns! Material liberado!",
        obrigado_subtitulo: "Clique no botão abaixo para fazer o download",
        obrigado_texto_botao: "Baixar Agora"
      };
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-lead-magnet:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});