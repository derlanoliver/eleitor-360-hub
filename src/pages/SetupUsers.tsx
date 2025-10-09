import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ADMIN_USERS = [
  { email: "anderlan@eleitor360.ai", password: "SuperAdmin@2025#Forte!", name: "Anderlan Super Admin", role: "super_admin", tenantId: null },
  { email: "admin@rafaelprudente.com", password: "Admin@2025#Seguro", name: "Admin Rafael", role: "admin", tenantId: null },
  { email: "gabriela@rafaelprudente.com", password: "Gabriela@2025", name: "Gabriela", role: "admin", tenantId: null },
  { email: "joao@rafaelprudente.com", password: "Joao@2025", name: "João", role: "admin", tenantId: null },
  { email: "david@rafaelprudente.com", password: "David@2025", name: "David", role: "admin", tenantId: null },
];

const SetupUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingUsers, setExistingUsers] = useState<string[]>([]);
  const [results, setResults] = useState<Array<{ email: string; success: boolean; message: string }>>([]);

  useEffect(() => {
    checkExistingUsers();
  }, []);

  const checkExistingUsers = async () => {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('email')
        .in('email', ADMIN_USERS.map(u => u.email));
      
      const existing = users?.map(u => u.email) || [];
      setExistingUsers(existing);
    } catch (error) {
      console.error('Erro ao verificar usuários existentes:', error);
    } finally {
      setChecking(false);
    }
  };

  const createUsers = async () => {
    setLoading(true);
    setResults([]);
    const newResults: Array<{ email: string; success: boolean; message: string }> = [];

    for (const user of ADMIN_USERS) {
      // Pula usuários que já existem
      if (existingUsers.includes(user.email)) {
        newResults.push({
          email: user.email,
          success: false,
          message: 'Usuário já existe (pulado)'
        });
        setResults([...newResults]);
        continue;
      }

      try {
        const { data, error } = await supabase.functions.invoke('create-admin-user', {
          body: {
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role || 'admin',
            tenantId: user.tenantId
          }
        });

        if (error) {
          newResults.push({
            email: user.email,
            success: false,
            message: error.message
          });
          console.error(`Error creating ${user.email}:`, error);
        } else if (data?.error) {
          newResults.push({
            email: user.email,
            success: false,
            message: data.error
          });
        } else {
          newResults.push({
            email: user.email,
            success: true,
            message: 'Criado com sucesso!'
          });
        }
      } catch (err) {
        newResults.push({
          email: user.email,
          success: false,
          message: err instanceof Error ? err.message : 'Erro desconhecido'
        });
        console.error(`Exception creating ${user.email}:`, err);
      }
      setResults([...newResults]);
    }

    setLoading(false);
    
    const successCount = newResults.filter(r => r.success).length;
    if (successCount > 0) {
      toast.success(`${successCount} usuário(s) criado(s) com sucesso!`);
      
      // Se criou o super admin, sugerir logout
      const createdSuperAdmin = newResults.find(r => 
        r.email === 'anderlan@eleitor360.ai' && r.success
      );
      if (createdSuperAdmin) {
        setTimeout(() => {
          toast.info('Faça logout e entre com o novo super admin', {
            action: {
              label: 'Logout',
              onClick: () => navigate('/force-logout')
            }
          });
        }, 1000);
      }
    }
    
    // Recarrega lista de usuários existentes
    checkExistingUsers();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <CardTitle>Setup de Usuários Administrativos</CardTitle>
          <CardDescription>
            Crie os usuários administrativos do sistema. Usuários já existentes serão pulados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {existingUsers.length > 0 && (
            <Alert>
              <AlertDescription>
                <strong>{existingUsers.length} usuário(s) já existe(m):</strong>
                <ul className="list-disc pl-5 mt-2 text-sm">
                  {existingUsers.map(email => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Usuários a criar:</h3>
            <ul className="space-y-2">
              {ADMIN_USERS.map(user => {
                const exists = existingUsers.includes(user.email);
                return (
                  <li 
                    key={user.email}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      exists ? 'bg-muted border-muted' : 'bg-background border-border'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.name} • {user.role}
                      </div>
                    </div>
                    {exists && (
                      <span className="text-xs text-muted-foreground">Já existe</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <Button 
            onClick={createUsers} 
            disabled={loading || existingUsers.length === ADMIN_USERS.length}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando usuários...
              </>
            ) : existingUsers.length === ADMIN_USERS.length ? (
              "Todos os usuários já existem"
            ) : (
              `Criar ${ADMIN_USERS.length - existingUsers.length} usuário(s)`
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Resultados:</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{result.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {result.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupUsers;
