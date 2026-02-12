import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCoordinatorAuth } from "@/contexts/CoordinatorAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { normalizePhoneToE164 } from "@/utils/phoneNormalizer";
import logo from "@/assets/logo-rafael-prudente.png";

export default function CoordinatorLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useCoordinatorAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;

    setLoading(true);
    try {
      const normalizedPhone = normalizePhoneToE164(phone);
      const { data, error } = await (supabase.rpc as any)("coordinator_login", {
        p_phone: normalizedPhone,
        p_password: password,
      });

      if (error) throw error;
      const rows = data as any[];
      if (!rows || rows.length === 0) throw new Error("Credenciais inválidas.");

      const row = rows[0];
      login({
        leader_id: row.leader_id,
        nome_completo: row.nome_completo,
        telefone: row.telefone,
        email: row.email,
        affiliate_token: row.affiliate_token,
        pontuacao_total: row.pontuacao_total,
        cadastros: row.cadastros,
        hierarchy_level: row.hierarchy_level,
        is_verified: row.is_verified,
        cidade_nome: row.cidade_nome,
        session_token: row.session_token,
      });

      toast.success("Login realizado com sucesso!");
      navigate("/coordenador/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <img src={logo} alt="Logo" className="h-16 mb-6" />
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Portal do Coordenador</CardTitle>
          <CardDescription>Entre com seu telefone e senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(61) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
