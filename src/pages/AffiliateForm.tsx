import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Users, CheckCircle2 } from "lucide-react";
import { CitySelect } from "@/components/office/CitySelect";
import { PhoneInput } from "@/components/office/PhoneInput";
import type { OfficeLeader } from "@/types/office";

export default function AffiliateForm() {
  const { leaderToken } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leader, setLeader] = useState<OfficeLeader | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [aceitaReuniao, setAceitaReuniao] = useState("");
  const [continuaProjeto, setContinuaProjeto] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    loadLeader();
  }, [leaderToken]);

  const loadLeader = async () => {
    if (!leaderToken) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("lideres")
        .select("id, nome_completo, cidade_id, cidade:office_cities(nome, codigo_ra)")
        .eq("affiliate_token", leaderToken)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("Link inválido ou líder inativo");
        return;
      }

      setLeader(data as OfficeLeader);
    } catch (error: any) {
      console.error("Error loading leader:", error);
      toast.error("Erro ao carregar informações do líder");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !telefone || !cidadeId || !endereco || !dataNascimento || 
        !instagram || !facebook || !aceitaReuniao || !continuaProjeto || !observacoes) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (!leader) return;

    try {
      setSubmitting(true);

      const telefoneNorm = telefone.startsWith('+') ? telefone : `+55${telefone.replace(/\D/g, '')}`;

      const { data: contact, error: contactError } = await supabase
        .from("office_contacts")
        .upsert({
          nome,
          telefone_norm: telefoneNorm,
          cidade_id: cidadeId,
          endereco,
          data_nascimento: dataNascimento,
          instagram,
          facebook,
        }, {
          onConflict: 'telefone_norm',
        })
        .select()
        .single();

      if (contactError) throw contactError;

      const { data: visit, error: visitError } = await supabase
        .from("office_visits")
        .insert({
          protocolo: "",
          contact_id: contact.id,
          leader_id: leader.id,
          city_id: cidadeId,
          status: "FORM_SUBMITTED",
          created_by: null, // NULL = criado via formulário público de afiliado
        })
        .select()
        .single();

      if (visitError) throw visitError;

      const { error: formError } = await supabase
        .from("office_visit_forms")
        .insert({
          visit_id: visit.id,
          data_nascimento: dataNascimento,
          endereco,
          instagram,
          facebook,
          aceita_reuniao: aceitaReuniao === "sim",
          continua_projeto: continuaProjeto === "sim",
          observacoes,
          submitted_at: new Date().toISOString(),
        });

      if (formError) throw formError;

      setSubmitted(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este link de indicação não é válido ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-green-600 dark:text-green-400">Cadastro Realizado!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Obrigado por se cadastrar! Entraremos em contato em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-center text-xl md:text-2xl font-bold">
              FORMULÁRIO DE CADASTRO - VISITA AO GABINETE
            </CardTitle>
            
            <div className="mt-4 flex items-center justify-center gap-2 bg-white/10 rounded-lg p-3">
              <Users className="h-5 w-5" />
              <p className="text-sm font-medium">
                Indicado por: <span className="font-bold">{leader.nome_completo}</span>
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Dados Pessoais</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="João Silva"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">WhatsApp *</Label>
                    <Input
                      id="telefone"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(61) 99999-9999"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <CitySelect
                      value={cidadeId}
                      onValueChange={setCidadeId}
                      placeholder="Selecione sua cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Textarea
                    id="endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, complemento, bairro, CEP"
                    required
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Redes Sociais</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram *</Label>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@seu_instagram"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook *</Label>
                    <Input
                      id="facebook"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="facebook.com/seu_perfil"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Informações Adicionais</h3>
                
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Aceita fazer reunião? *</Label>
                  <RadioGroup value={aceitaReuniao} onValueChange={setAceitaReuniao} required>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="reuniao-sim" />
                      <Label htmlFor="reuniao-sim" className="font-normal cursor-pointer">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="reuniao-nao" />
                      <Label htmlFor="reuniao-nao" className="font-normal cursor-pointer">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Continua no Projeto? *</Label>
                  <RadioGroup value={continuaProjeto} onValueChange={setContinuaProjeto} required>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="projeto-sim" />
                      <Label htmlFor="projeto-sim" className="font-normal cursor-pointer">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="projeto-nao" />
                      <Label htmlFor="projeto-nao" className="font-normal cursor-pointer">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações *</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Digite aqui suas observações"
                    required
                    rows={4}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Cadastro"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
