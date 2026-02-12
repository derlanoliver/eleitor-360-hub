import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCoordinatorAuth } from "@/contexts/CoordinatorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, CheckCircle, Loader2, MessageCircle, Phone,
  ShieldCheck, ShieldAlert, AlertCircle,
} from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsappLink";
import logo from "@/assets/logo-rafael-prudente.png";

type VerificationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "already_verified"; nome: string }
  | { status: "not_found" }
  | {
      status: "ready";
      leader: {
        id: string;
        nome_completo: string;
        telefone: string;
        verification_code: string;
      };
      keyword: string;
      whatsAppPhone: string;
    }
  | { status: "error"; message: string };

export default function CoordinatorVerifyLeader() {
  const navigate = useNavigate();
  const { isAuthenticated, session } = useCoordinatorAuth();
  const [phoneInput, setPhoneInput] = useState("");
  const [state, setState] = useState<VerificationState>({ status: "idle" });

  if (!isAuthenticated || !session) return null;

  const normalizeDigits = (phone: string) => phone.replace(/\D/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizeDigits(phoneInput);

    if (digits.length < 10) {
      setState({ status: "error", message: "Número inválido. Digite DDD + número." });
      return;
    }

    setState({ status: "loading" });

    try {
      // Normalizar para encontrar: tentar com +55, sem +55, etc
      const possiblePhones: string[] = [];
      if (digits.length === 11) {
        possiblePhones.push(`+55${digits}`, `55${digits}`, digits);
      } else if (digits.length === 13 && digits.startsWith("55")) {
        possiblePhones.push(`+${digits}`, digits, digits.slice(2));
      } else {
        possiblePhones.push(digits);
      }

      // Buscar por last 8 digits para match flexível (como o sistema faz)
      const last8 = digits.slice(-8);

      const { data: leaders, error } = await supabase
        .from("lideres")
        .select("id, nome_completo, telefone, verification_code, is_verified, verified_at")
        .or(possiblePhones.map(p => `telefone.eq.${p}`).join(","));

      // Se não achou com match exato, tentar por últimos 8 dígitos
      let matched = leaders && leaders.length > 0 ? leaders : null;

      if (!matched) {
        const { data: allLeaders } = await supabase
          .from("lideres")
          .select("id, nome_completo, telefone, verification_code, is_verified, verified_at")
          .not("telefone", "is", null);

        if (allLeaders) {
          const found = allLeaders.filter(l => {
            const lDigits = normalizeDigits(l.telefone || "");
            return lDigits.slice(-8) === last8 && lDigits.length >= 10;
          });
          if (found.length > 0) matched = found;
        }
      }

      if (!matched || matched.length === 0) {
        setState({ status: "not_found" });
        return;
      }

      const leader = matched[0];

      if (leader.is_verified || leader.verified_at) {
        setState({ status: "already_verified", nome: leader.nome_completo });
        return;
      }

      if (!leader.verification_code) {
        setState({ status: "error", message: "Este líder não possui código de verificação. Contate o administrador." });
        return;
      }

      // Buscar keyword e telefone do WhatsApp das configurações
      const { data: settings } = await supabase
        .from("integrations_settings")
        .select("verification_wa_keyword, verification_wa_zapi_phone")
        .limit(1)
        .single();

      setState({
        status: "ready",
        leader: {
          id: leader.id,
          nome_completo: leader.nome_completo,
          telefone: leader.telefone || "",
          verification_code: leader.verification_code,
        },
        keyword: settings?.verification_wa_keyword || "CONFIRMAR",
        whatsAppPhone: settings?.verification_wa_zapi_phone || "5561981894692",
      });
    } catch (err: any) {
      console.error("[CoordinatorVerifyLeader] Error:", err);
      setState({ status: "error", message: "Erro ao buscar líder. Tente novamente." });
    }
  };

  const handleReset = () => {
    setPhoneInput("");
    setState({ status: "idle" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coordenador/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Verificação de Apoiador</h1>
            <p className="text-xs text-muted-foreground">Via WhatsApp</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Formulário de busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5" />
              Buscar Apoiador por Telefone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Celular</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(61) 99999-9999"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  disabled={state.status === "loading"}
                />
                <p className="text-xs text-muted-foreground">
                  Digite o DDD + número do celular do apoiador
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={state.status === "loading" || !phoneInput.trim()}
              >
                {state.status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultado: Já verificado */}
        {state.status === "already_verified" && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-green-100 p-4">
                  <ShieldCheck className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-800">Já Verificado!</h2>
                  <p className="text-green-700 mt-1">
                    O apoiador <strong>{state.nome}</strong> já foi verificado anteriormente.
                  </p>
                </div>
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
                <Button variant="outline" onClick={handleReset} className="mt-2">
                  Buscar outro número
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado: Não encontrado */}
        {state.status === "not_found" && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-amber-100 p-4">
                  <ShieldAlert className="h-12 w-12 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-amber-800">Não Encontrado</h2>
                  <p className="text-amber-700 mt-1">
                    Nenhum apoiador cadastrado com este número de telefone.
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset} className="mt-2">
                  Tentar outro número
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado: Erro */}
        {state.status === "error" && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-red-100 p-4">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-800">Erro</h2>
                  <p className="text-red-700 mt-1">{state.message}</p>
                </div>
                <Button variant="outline" onClick={handleReset} className="mt-2">
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado: Pronto para verificar */}
        {state.status === "ready" && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-green-100 p-4">
                  <MessageCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Verificação Iniciada!</h2>
                  <p className="text-muted-foreground mt-1">
                    Apoiador: <strong>{state.leader.nome_completo}</strong>
                  </p>
                </div>

                <div className="w-full bg-white border rounded-lg p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Para confirmar o cadastro, envie a mensagem abaixo pelo WhatsApp:
                  </p>
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                    <span className="text-lg font-bold text-green-800">
                      {state.keyword} {state.leader.verification_code}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ A mensagem deve ser enviada do número <strong>{state.leader.telefone}</strong> para que a verificação funcione. Se outra pessoa enviar este código, o sistema não validará.
                  </p>
                </div>

                {(() => {
                  const phone = state.whatsAppPhone.replace(/\D/g, "");
                  const messageText = `${state.keyword} ${state.leader.verification_code}`;
                  const href = buildWhatsAppLink(phone, messageText);

                  return (
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                      <a href={href} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Confirmar via WhatsApp
                      </a>
                    </Button>
                  );
                })()}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 w-full">
                  <p className="font-semibold mb-1">📱 Importante!</p>
                  <p>
                    Após enviar "{state.keyword} {state.leader.verification_code}" do número cadastrado, 
                    o apoiador receberá automaticamente seu link de indicação.
                  </p>
                </div>

                <Button variant="outline" onClick={handleReset} className="mt-2">
                  Buscar outro número
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
