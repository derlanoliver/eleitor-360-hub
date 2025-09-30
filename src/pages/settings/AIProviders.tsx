import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AIProviders = () => {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave de API válida.",
        variant: "destructive",
      });
      return;
    }

    // Simular salvamento (futuramente irá para env/secrets)
    console.log("API Key saved (mock):", apiKey.substring(0, 10) + "...");
    setIsSaved(true);
    
    toast({
      title: "Configuração salva",
      description: "A chave de API foi salva com sucesso.",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Provedores de IA</h1>
        <p className="text-gray-600 mt-1">
          Configure as credenciais para integração com serviços de IA
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Esta configuração está preparada para integração futura. As chamadas de IA ainda estão em modo simulado.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary-500" />
            OpenAI API Key
          </CardTitle>
          <CardDescription>
            Configure sua chave de API da OpenAI para habilitar o modelo GPT-5 no Agente IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">Chave de API</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-proj-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsSaved(false);
              }}
            />
            <p className="text-sm text-gray-500">
              Obtenha sua chave em{" "}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>

          {isSaved && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Chave de API configurada com sucesso
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button onClick={handleSave}>
              Salvar Configuração
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setApiKey("");
                setIsSaved(false);
              }}
            >
              Limpar
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">Modelo configurado:</h4>
            <p className="text-sm text-gray-600">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">gpt-5</span>
              {" "}• Flagship OpenAI model
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIProviders;
