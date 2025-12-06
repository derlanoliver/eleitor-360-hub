import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Survey, SurveyQuestion } from "@/hooks/surveys/useSurveys";

interface SurveyAIAnalysisPanelProps {
  survey: Survey;
  questions: SurveyQuestion[];
  responses: any[];
}

export function SurveyAIAnalysisPanel({ survey, questions, responses }: SurveyAIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    if (responses.length === 0) {
      setError("Não há respostas suficientes para análise");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis("");

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-survey`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          survey,
          questions,
          responses: responses.map(r => ({
            respostas: r.respostas,
            is_leader: r.is_leader,
            has_referrer: !!r.referred_by_leader_id,
            created_at: r.created_at,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar análise");
      }

      if (!response.body) {
        throw new Error("Resposta sem corpo");
      }

      // Stream SSE response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setAnalysis(prev => prev + content);
            }
          } catch {
            // Incomplete JSON, wait for more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("Erro na análise:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Análise com Inteligência Artificial</CardTitle>
          </div>
          <Button 
            onClick={generateAnalysis} 
            disabled={isLoading || responses.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : analysis ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Análise
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Análise
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aguardando respostas para gerar análise
            </p>
          </div>
        ) : !analysis && !isLoading && !error ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Clique em "Gerar Análise" para obter insights sobre as respostas
            </p>
            <p className="text-sm text-muted-foreground">
              A análise inclui resumo executivo, principais insights, oportunidades e recomendações estratégicas
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={generateAnalysis}>
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis || "Gerando análise..."}
            </ReactMarkdown>
            {isLoading && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
