import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, RefreshCw, Sparkles, AlertTriangle, TrendingUp, MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CityMapData } from "@/hooks/maps/useStrategicMapData";

interface MapAnalysisPanelProps {
  cities: CityMapData[];
  totalLeaders: number;
  totalContacts: number;
  totalConnections: number;
}

export function MapAnalysisPanel({ 
  cities, 
  totalLeaders, 
  totalContacts,
  totalConnections 
}: MapAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Preparar dados para análise
      const regioesComDados = cities
        .filter(c => c.leaders_count > 0 || c.contacts_count > 0)
        .map(c => ({
          nome: c.nome,
          lideres: c.leaders_count,
          contatos: c.contacts_count,
          proporcao: c.leaders_count > 0 ? Math.round(c.contacts_count / c.leaders_count) : 0
        }))
        .sort((a, b) => b.contatos - a.contatos);

      const regioesSemLideres = cities.filter(c => c.leaders_count === 0 && c.contacts_count > 0);
      const regioesSemCobertura = cities.filter(c => c.leaders_count === 0 && c.contacts_count === 0);
      
      const mediaContatos = totalLeaders > 0 ? Math.round(totalContacts / totalLeaders) : 0;
      const regioesAbaixoMedia = regioesComDados.filter(r => r.contatos < mediaContatos && r.contatos > 0);

      const contexto = `
## Dados do Mapa Estratégico

### Resumo Geral
- Total de Líderes: ${totalLeaders}
- Total de Contatos: ${totalContacts}
- Total de Conexões Líder-Contato: ${totalConnections}
- Média de contatos por líder: ${mediaContatos}

### Top 10 Regiões por Contatos
${regioesComDados.slice(0, 10).map(r => `- ${r.nome}: ${r.lideres} líderes, ${r.contatos} contatos`).join('\n')}

### Regiões SEM Líderes (mas com contatos)
${regioesSemLideres.length > 0 ? regioesSemLideres.map(r => `- ${r.nome}: ${r.contacts_count} contatos órfãos`).join('\n') : 'Nenhuma'}

### Regiões SEM Cobertura (sem líderes e sem contatos)
${regioesSemCobertura.length > 0 ? regioesSemCobertura.slice(0, 10).map(r => `- ${r.nome}`).join('\n') : 'Todas as regiões têm alguma cobertura'}

### Regiões Abaixo da Média
${regioesAbaixoMedia.length > 0 ? regioesAbaixoMedia.slice(0, 10).map(r => `- ${r.nome}: apenas ${r.contatos} contatos`).join('\n') : 'Nenhuma região significativamente abaixo da média'}
`;

      const prompt = `Você é um analista político estratégico. Com base nos dados do mapa de atuação política abaixo, forneça uma análise estratégica concisa e acionável.

${contexto}

## Instruções
Forneça uma análise em português do Brasil com no máximo 400 palavras, organizada em:

1. **🎯 Pontos Fortes** - Regiões com boa cobertura e presença de líderes
2. **⚠️ Lacunas Críticas** - Regiões prioritárias que precisam de atenção imediata (sem líderes ou muito abaixo da média)
3. **📈 Oportunidades de Expansão** - Sugestões específicas de onde recrutar novos líderes
4. **💡 Recomendações** - 3-5 ações práticas e específicas para melhorar a cobertura territorial

Seja direto, use dados específicos dos números fornecidos, e priorize recomendações acionáveis.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            skipFunctions: true
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Resposta sem body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                result += content;
                setAnalysis(result);
              }
            } catch {
              // Ignorar linhas mal formadas
            }
          }
        }
      }

      // Processar buffer restante
      if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
        try {
          const json = JSON.parse(buffer.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            result += content;
            setAnalysis(result);
          }
        } catch {
          // Ignorar
        }
      }

      if (!result) {
        throw new Error('Nenhum conteúdo recebido da IA');
      }
    } catch (err) {
      console.error('Erro ao gerar análise:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar análise');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise Estratégica (IA)
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateAnalysis}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {analysis ? 'Atualizar' : 'Gerar Análise'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isLoading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Clique em "Gerar Análise" para obter insights sobre a cobertura territorial
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Lacunas de cobertura
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Oportunidades de expansão
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Regiões prioritárias
              </span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {error && (
          <div className="text-center py-6 text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateAnalysis}
              className="mt-3"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {analysis && !isLoading && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
                h2: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>,
                h3: ({ children }) => <h4 className="text-sm font-medium mt-2 mb-1">{children}</h4>,
                p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                ul: ({ children }) => <ul className="text-sm space-y-1 mb-3 list-disc pl-4">{children}</ul>,
                ol: ({ children }) => <ol className="text-sm space-y-1 mb-3 list-decimal pl-4">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
