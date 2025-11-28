import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { trackLead, pushToDataLayer } from "@/lib/trackingUtils";

export default function ScheduleVisit() {
  const { visitId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visit, setVisit] = useState<any>(null);

  // Form data
  const [dataNascimento, setDataNascimento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [aceitaReuniao, setAceitaReuniao] = useState<string>("");
  const [continuaProjeto, setContinuaProjeto] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    loadVisit();
  }, [visitId]);

  const loadVisit = async () => {
    if (!visitId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("office_visits")
        .select(`
          *,
          contact:office_contacts(nome, telefone_norm),
          city:office_cities(nome)
        `)
        .eq("id", visitId)
        .single();

      if (error) throw error;
      setVisit(data);
      
      // Atualizar status para FORM_OPENED se ainda estiver em LINK_SENT
      if (data.status === "LINK_SENT") {
        const { error: updateError } = await supabase
          .from("office_visits")
          .update({ status: "FORM_OPENED" })
          .eq("id", visitId);
        
        if (updateError) {
          console.error("Error updating status to FORM_OPENED:", updateError);
        }
      }
    } catch (error: any) {
      console.error("Error loading visit:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da visita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!dataNascimento || !endereco || !instagram || !facebook || !aceitaReuniao || !continuaProjeto || !observacoes) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // 1. Insert form data into office_visit_forms
      const { error: formError } = await supabase
        .from("office_visit_forms")
        .insert({
          visit_id: visitId,
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

      // 2. Update contact with form data
      const { error: contactError } = await supabase
        .from("office_contacts")
        .update({
          endereco,
          data_nascimento: dataNascimento,
          instagram,
          facebook,
        })
        .eq("id", visit?.contact_id);

      if (contactError) throw contactError;

      // 3. Update visit status
      const { error: visitError } = await supabase
        .from("office_visits")
        .update({ status: "FORM_SUBMITTED" })
        .eq("id", visitId);

      if (visitError) throw visitError;

      setSubmitted(true);
      toast({
        title: "Formulário enviado!",
        description: "Obrigado por preencher o formulário",
      });

      // Track Lead event
      trackLead({ 
        content_name: 'visita_gabinete',
        value: 1
      });
      
      // Push to GTM dataLayer
      pushToDataLayer('lead', { 
        source: 'visita_gabinete',
        visit_id: visitId
      });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar formulário. Tente novamente.",
        variant: "destructive",
      });
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

  if (!visit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Visita não encontrada</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">✓ Formulário Enviado</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Obrigado por preencher o formulário! Entraremos em contato em breve.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="bg-orange-500 text-white rounded-t-lg">
            <CardTitle className="text-center text-xl md:text-2xl font-bold">
              FICHA CADASTRAL - BANCO DE DADOS - REDES SOCIAIS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pre-filled fields (disabled) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={visit.contact?.nome || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={visit.contact?.telefone_norm || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={visit.city?.nome || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Required fields */}
              <div className="grid md:grid-cols-2 gap-4">
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

              {/* Radio buttons */}
              <div className="space-y-4">
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
                  "Enviar Formulário"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
