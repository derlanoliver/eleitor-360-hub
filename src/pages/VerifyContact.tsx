import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VerificationResult {
  success: boolean;
  already_verified?: boolean;
  nome?: string;
  lider_nome?: string;
  error?: string;
  message?: string;
}

export default function VerifyContact() {
  const { codigo } = useParams<{ codigo: string }>();
  const { data: organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    async function verifyContact() {
      if (!codigo) {
        setResult({ success: false, error: "no_code", message: "Código não fornecido." });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("verify_contact_by_code", {
          _code: codigo,
        });

        if (error) {
          console.error("Verification error:", error);
          setResult({ success: false, error: "rpc_error", message: "Erro ao verificar cadastro." });
        } else {
          setResult(data as unknown as VerificationResult);
        }
      } catch (err) {
        console.error("Error:", err);
        setResult({ success: false, error: "unknown", message: "Erro inesperado." });
      } finally {
        setLoading(false);
      }
    }

    verifyContact();
  }, [codigo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando seu cadastro...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
          {/* Logo */}
          {organization?.logo_url && (
            <img
              src={organization.logo_url}
              alt={organization.nome}
              className="h-16 w-auto object-contain"
            />
          )}

          {result?.success ? (
            <>
              {/* Success Icon */}
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>

              {/* Success Message */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {result.already_verified
                    ? "Cadastro Já Verificado!"
                    : "Verificação Realizada com Sucesso!"}
                </h1>

                {result.nome && (
                  <p className="text-lg text-muted-foreground">
                    Olá, <span className="font-semibold text-foreground">{result.nome}</span>!
                  </p>
                )}

                <p className="text-muted-foreground">
                  Seu cadastro com indicação de{" "}
                  <span className="font-semibold text-primary">{result.lider_nome}</span>{" "}
                  foi confirmado.
                </p>

                {!result.already_verified && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Agradecemos pela confirmação!
                  </p>
                )}
              </div>
            </>
          ) : result?.error === "invalid_code" ? (
            <>
              {/* Invalid Code Icon */}
              <div className="rounded-full bg-amber-100 p-4">
                <AlertCircle className="h-16 w-16 text-amber-600" />
              </div>

              {/* Invalid Message */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Código Inválido
                </h1>
                <p className="text-muted-foreground">
                  O código de verificação informado não é válido ou já expirou.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Error Icon */}
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>

              {/* Error Message */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Erro na Verificação
                </h1>
                <p className="text-muted-foreground">
                  {result?.message || "Ocorreu um erro ao processar sua verificação."}
                </p>
              </div>
            </>
          )}

          {/* Organization Name */}
          <div className="pt-4 border-t w-full text-center">
            <p className="text-sm text-muted-foreground">
              {organization?.nome || "Plataforma"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
