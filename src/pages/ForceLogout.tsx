import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * Página para forçar logout do usuário atual
 * Útil após ajustes de roles e permissões
 */
const ForceLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Forçando logout do usuário atual...');
        await supabase.auth.signOut();
        
        // Aguarda um pouco para garantir logout completo
        setTimeout(() => {
          console.log('Logout concluído, redirecionando...');
          navigate("/login", { replace: true });
        }, 1000);
      } catch (error) {
        console.error('Erro ao forçar logout:', error);
        // Mesmo com erro, redireciona para login
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1000);
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Desconectando...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Sua sessão está sendo encerrada devido a ajustes de permissões.
            <br />
            Você será redirecionado em instantes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForceLogout;
