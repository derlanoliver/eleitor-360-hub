import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const ADMIN_USERS = [
  { email: "admin@rafaelprudente.com", password: "Admin@2025#Seguro", name: "Admin Rafael" },
  { email: "gabriela@rafaelprudente.com", password: "Gabriela@2025", name: "Gabriela" },
  { email: "joao@rafaelprudente.com", password: "Joao@2025", name: "João" },
  { email: "david@rafaelprudente.com", password: "David@2025", name: "David" },
];

const SetupUsers = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const createUsers = async () => {
    setLoading(true);
    setResults([]);
    const newResults: string[] = [];

    for (const user of ADMIN_USERS) {
      try {
        const { data, error } = await supabase.functions.invoke('create-admin-user', {
          body: {
            email: user.email,
            password: user.password,
            name: user.name,
            role: 'admin'
          }
        });

        if (error) {
          newResults.push(`❌ ${user.email}: ${error.message}`);
          console.error(`Error creating ${user.email}:`, error);
        } else if (data?.error) {
          newResults.push(`❌ ${user.email}: ${data.error}`);
        } else {
          newResults.push(`✅ ${user.email}: Criado com sucesso!`);
        }
      } catch (err) {
        newResults.push(`❌ ${user.email}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        console.error(`Exception creating ${user.email}:`, err);
      }
      setResults([...newResults]);
    }

    setLoading(false);
    toast.success("Processo de criação de usuários concluído!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Setup de Usuários Administrativos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Clique no botão abaixo para criar os usuários administrativos:
          </p>
          
          <ul className="list-disc pl-6 space-y-1 text-sm">
            {ADMIN_USERS.map(user => (
              <li key={user.email}>{user.email}</li>
            ))}
          </ul>

          <Button 
            onClick={createUsers} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Criando usuários..." : "Criar Usuários"}
          </Button>

          {results.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-semibold mb-2">Resultados:</h3>
              <ul className="space-y-1 text-sm font-mono">
                {results.map((result, index) => (
                  <li key={index}>{result}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupUsers;
