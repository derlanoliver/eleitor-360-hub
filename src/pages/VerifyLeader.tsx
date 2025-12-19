import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { CheckCircle, XCircle, Loader2, AlertCircle, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getBaseUrl } from "@/lib/urlHelper";

interface VerificationResult {
  success: boolean;
  already_verified?: boolean;
  nome?: string;
  leader_id?: string;
  affiliate_token?: string;
  error?: string;
  message?: string;
}

export default function VerifyLeader() {
  const { codigo } = useParams<{ codigo: string }>();
  const { data: organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [sendingLinks, setSendingLinks] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [linksSent, setLinksSent] = useState(false);

  useEffect(() => {
    async function verifyLeader() {
      if (!codigo) {
        setResult({ success: false, error: "no_code", message: "Código não fornecido." });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("verify_leader_by_code", {
          _code: codigo,
        });

        if (error) {
          console.error("Verification error:", error);
          setResult({ success: false, error: "rpc_error", message: "Erro ao verificar cadastro." });
        } else {
          const verificationResult = data as unknown as VerificationResult;
          setResult(verificationResult);

          // Se verificado com sucesso (não era já verificado), enviar links de afiliado
          if (verificationResult.success && !verificationResult.already_verified && verificationResult.leader_id) {
            await sendAffiliateLinks(verificationResult.leader_id, verificationResult.affiliate_token || "");
          }
        }
      } catch (err) {
        console.error("Error:", err);
        setResult({ success: false, error: "unknown", message: "Erro inesperado." });
      } finally {
        setLoading(false);
      }
    }

    verifyLeader();
  }, [codigo]);

  async function sendAffiliateLinks(leaderId: string, affiliateToken: string) {
    if (!affiliateToken) return;

    setSendingLinks(true);
    try {
      // Buscar dados do líder para enviar links
      const { data: leader, error: leaderError } = await supabase
        .from("lideres")
        .select("nome_completo, telefone, email")
        .eq("id", leaderId)
        .single();

      if (leaderError || !leader) {
        console.error("Erro ao buscar líder:", leaderError);
        return;
      }

      const affiliateLink = `${getBaseUrl()}/cadastro/${affiliateToken}`;

      // Gerar QR Code
      const QRCode = (await import("qrcode")).default;
      const qrCodeDataUrl = await QRCode.toDataURL(affiliateLink, { width: 300 });

      // Enviar WhatsApp com QR code
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: leader.telefone,
            templateSlug: "lideranca-cadastro-link",
            variables: {
              nome: leader.nome_completo,
              link_cadastro_afiliado: affiliateLink,
            },
            imageUrl: qrCodeDataUrl,
          },
        });
      } catch (e) {
        console.error("Erro ao enviar WhatsApp:", e);
      }

      // Enviar SMS com link
      try {
        await supabase.functions.invoke("send-sms", {
          body: {
            phone: leader.telefone,
            templateSlug: "lider-cadastro-confirmado-sms",
            variables: {
              nome: leader.nome_completo,
              link_indicacao: affiliateLink,
            },
          },
        });
      } catch (e) {
        console.error("Erro ao enviar SMS:", e);
      }

      // Enviar email de boas-vindas (se tiver email)
      if (leader.email) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: leader.email,
              toName: leader.nome_completo,
              templateSlug: "lideranca-boas-vindas",
              variables: {
                nome: leader.nome_completo,
                link_indicacao: affiliateLink,
              },
            },
          });
        } catch (e) {
          console.error("Erro ao enviar email:", e);
        }
      }

      setLinksSent(true);
    } catch (err) {
      console.error("Erro ao enviar links de afiliado:", err);
    } finally {
      setSendingLinks(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando seu cadastro de liderança...</p>
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
              <div className="rounded-full bg-amber-100 p-4">
                <Crown className="h-16 w-16 text-amber-600" />
              </div>

              {/* Success Message */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {result.already_verified
                    ? "Cadastro Já Verificado!"
                    : "Bem-vindo(a) à Nossa Rede de Lideranças!"}
                </h1>

                {result.nome && (
                  <p className="text-lg text-muted-foreground">
                    Olá, <span className="font-semibold text-foreground">{result.nome}</span>!
                  </p>
                )}

                {!result.already_verified ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Seu cadastro como liderança foi confirmado com sucesso!
                    </p>

                    {sendingLinks ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enviando seu link exclusivo de indicação...</span>
                      </div>
                    ) : linksSent ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Link de indicação enviado!</span>
                        </div>
                        <p className="text-sm text-green-600 mt-2">
                          Enviamos seu link exclusivo via WhatsApp, SMS e Email.
                          Use-o para convidar mais pessoas!
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Você já havia confirmado seu cadastro anteriormente.
                    Seu link de indicação já foi enviado.
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
                <h1 className="text-2xl font-bold text-foreground">Código Inválido</h1>
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
                <h1 className="text-2xl font-bold text-foreground">Erro na Verificação</h1>
                <p className="text-muted-foreground">
                  {result?.message || "Ocorreu um erro ao processar sua verificação."}
                </p>
              </div>
            </>
          )}

          {/* Organization Name */}
          <div className="pt-4 border-t w-full text-center">
            <p className="text-sm text-muted-foreground">{organization?.nome || "Plataforma"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
