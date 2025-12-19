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

interface SendResults {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
}

export default function VerifyLeader() {
  const { codigo } = useParams<{ codigo: string }>();
  const { data: organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [sendingLinks, setSendingLinks] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [linksSent, setLinksSent] = useState(false);
  const [sendResults, setSendResults] = useState<SendResults>({ sms: false, whatsapp: false, email: false });

  useEffect(() => {
    async function verifyLeader() {
      if (!codigo) {
        setResult({ success: false, error: "no_code", message: "Código não fornecido." });
        setLoading(false);
        return;
      }

      try {
        console.log("[VerifyLeader] Iniciando verificação com código:", codigo);
        const { data, error } = await supabase.rpc("verify_leader_by_code", {
          _code: codigo,
        });

        if (error) {
          console.error("[VerifyLeader] Erro na verificação RPC:", error);
          setResult({ success: false, error: "rpc_error", message: "Erro ao verificar cadastro." });
        } else {
          const verificationResult = data as unknown as VerificationResult;
          console.log("[VerifyLeader] Resultado da verificação:", verificationResult);
          setResult(verificationResult);

          // Se verificado com sucesso (não era já verificado), enviar links de afiliado
          if (verificationResult.success && !verificationResult.already_verified && verificationResult.leader_id) {
            console.log("[VerifyLeader] Líder verificado, enviando links de afiliado...");
            await sendAffiliateLinks(verificationResult.leader_id, verificationResult.affiliate_token || "");
          }
        }
      } catch (err) {
        console.error("[VerifyLeader] Erro inesperado:", err);
        setResult({ success: false, error: "unknown", message: "Erro inesperado." });
      } finally {
        setLoading(false);
      }
    }

    verifyLeader();
  }, [codigo]);

  async function sendAffiliateLinks(leaderId: string, affiliateToken: string) {
    if (!affiliateToken) {
      console.warn("[VerifyLeader] Token de afiliado vazio, não enviando links");
      return;
    }

    setSendingLinks(true);
    const results: SendResults = { sms: false, whatsapp: false, email: false };

    try {
      // Buscar dados do líder para enviar links
      console.log("[VerifyLeader] Buscando dados do líder:", leaderId);
      const { data: leader, error: leaderError } = await supabase
        .from("lideres")
        .select("nome_completo, telefone, email")
        .eq("id", leaderId)
        .single();

      if (leaderError || !leader) {
        console.error("[VerifyLeader] Erro ao buscar líder:", leaderError);
        setSendingLinks(false);
        return;
      }

      const affiliateLink = `${getBaseUrl()}/cadastro/${affiliateToken}`;
      console.log("[VerifyLeader] Dados do líder:", {
        nome: leader.nome_completo,
        telefone: leader.telefone ? "***" + leader.telefone.slice(-4) : "N/A",
        email: leader.email ? leader.email.split("@")[0].slice(0, 3) + "***@" + leader.email.split("@")[1] : "N/A",
        affiliateLink,
      });

      // Gerar QR Code
      let qrCodeDataUrl = "";
      try {
        const QRCode = (await import("qrcode")).default;
        qrCodeDataUrl = await QRCode.toDataURL(affiliateLink, { width: 300 });
        console.log("[VerifyLeader] QR Code gerado com sucesso");
      } catch (qrError) {
        console.error("[VerifyLeader] Erro ao gerar QR Code:", qrError);
      }

      // ============================================
      // 1. ENVIAR SMS (independente dos outros)
      // ============================================
      if (leader.telefone) {
        try {
          console.log("[VerifyLeader] Iniciando envio de SMS...");
          const smsResponse = await supabase.functions.invoke("send-sms", {
            body: {
              phone: leader.telefone,
              templateSlug: "lider-cadastro-confirmado-sms",
              variables: {
                nome: leader.nome_completo,
                link_indicacao: affiliateLink,
              },
            },
          });

          console.log("[VerifyLeader] Resposta SMS:", {
            error: smsResponse.error,
            data: smsResponse.data,
          });

          if (smsResponse.error) {
            console.error("[VerifyLeader] Erro no SMS:", smsResponse.error);
          } else {
            results.sms = true;
            console.log("[VerifyLeader] SMS enviado com sucesso!");
          }
        } catch (smsError) {
          console.error("[VerifyLeader] Exceção ao enviar SMS:", smsError);
        }
      } else {
        console.warn("[VerifyLeader] Líder sem telefone, SMS não enviado");
      }

      // ============================================
      // 2. ENVIAR WHATSAPP (independente dos outros)
      // ============================================
      if (leader.telefone) {
        try {
          console.log("[VerifyLeader] Iniciando envio de WhatsApp...");
          const waResponse = await supabase.functions.invoke("send-whatsapp", {
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

          console.log("[VerifyLeader] Resposta WhatsApp:", {
            error: waResponse.error,
            data: waResponse.data,
          });

          if (waResponse.error) {
            console.error("[VerifyLeader] Erro no WhatsApp:", waResponse.error);
          } else {
            results.whatsapp = true;
            console.log("[VerifyLeader] WhatsApp enviado com sucesso!");
          }
        } catch (waError) {
          console.error("[VerifyLeader] Exceção ao enviar WhatsApp:", waError);
        }
      } else {
        console.warn("[VerifyLeader] Líder sem telefone, WhatsApp não enviado");
      }

      // ============================================
      // 3. ENVIAR EMAIL (independente dos outros)
      // ============================================
      if (leader.email) {
        try {
          console.log("[VerifyLeader] Iniciando envio de Email...");
          const emailResponse = await supabase.functions.invoke("send-email", {
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

          console.log("[VerifyLeader] Resposta Email:", {
            error: emailResponse.error,
            data: emailResponse.data,
          });

          if (emailResponse.error) {
            console.error("[VerifyLeader] Erro no Email:", emailResponse.error);
          } else {
            results.email = true;
            console.log("[VerifyLeader] Email enviado com sucesso!");
          }
        } catch (emailError) {
          console.error("[VerifyLeader] Exceção ao enviar Email:", emailError);
        }
      } else {
        console.warn("[VerifyLeader] Líder sem email, Email não enviado");
      }

      // Atualizar estados com resultados
      setSendResults(results);
      console.log("[VerifyLeader] Resultados finais de envio:", results);

      // Considerar links enviados se pelo menos SMS ou Email funcionou
      if (results.sms || results.email) {
        setLinksSent(true);
        console.log("[VerifyLeader] Links marcados como enviados (SMS ou Email funcionou)");
      } else {
        console.warn("[VerifyLeader] Nenhum canal de envio funcionou (SMS nem Email)");
        // Mesmo se falhar, marcar como tentativa feita para não bloquear a UI
        setLinksSent(true);
      }
    } catch (err) {
      console.error("[VerifyLeader] Erro geral ao enviar links de afiliado:", err);
      // Mesmo em caso de erro geral, não bloquear a UI
      setLinksSent(true);
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
                          {sendResults.sms || sendResults.email || sendResults.whatsapp
                            ? `Enviamos seu link exclusivo via ${[
                                sendResults.whatsapp && "WhatsApp",
                                sendResults.sms && "SMS",
                                sendResults.email && "Email",
                              ]
                                .filter(Boolean)
                                .join(", ")}. Use-o para convidar mais pessoas!`
                            : "Processamos seu cadastro. Seu link de indicação estará disponível em breve."}
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
