import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CalendarIcon, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ScheduleVisit() {
  const { visitId, leaderId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visit, setVisit] = useState<any>(null);
  
  // Form state
  const [dataNascimento, setDataNascimento] = useState<Date>();
  const [endereco, setEndereco] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [aceitaReuniao, setAceitaReuniao] = useState(false);
  const [continuaProjeto, setContinuaProjeto] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  
  useEffect(() => {
    loadVisit();
  }, [visitId]);
  
  const loadVisit = async () => {
    try {
      const { data, error } = await supabase
        .from("office_visits")
        .select(`
          *,
          contact:office_contacts(*),
          leader:lideres(*),
          city:office_cities(*)
        `)
        .eq("id", visitId)
        .single();
      
      if (error) throw error;
      
      setVisit(data);
    } catch (error) {
      console.error("Erro ao carregar visita:", error);
      toast.error("Visita não encontrada");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataNascimento || !endereco) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Inserir formulário
      const { error: formError } = await supabase
        .from("office_visit_forms")
        .insert({
          visit_id: visitId,
          data_nascimento: format(dataNascimento, "yyyy-MM-dd"),
          endereco,
          instagram: instagram || null,
          facebook: facebook || null,
          aceita_reuniao: aceitaReuniao,
          continua_projeto: continuaProjeto,
          observacoes: observacoes || null,
          submitted_at: new Date().toISOString()
        });
      
      if (formError) throw formError;
      
      // Atualizar status da visita
      const { error: updateError } = await supabase
        .from("office_visits")
        .update({ status: "FORM_SUBMITTED" })
        .eq("id", visitId);
      
      if (updateError) throw updateError;
      
      setSubmitted(true);
      toast.success("Formulário enviado com sucesso!");
      
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast.error("Erro ao enviar formulário");
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
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Visita não encontrada</CardTitle>
            <CardDescription>
              O link que você acessou não é válido ou expirou.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Formulário Enviado!</CardTitle>
              <CardDescription>
                Obrigado por preencher o formulário. Em breve entraremos em contato.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Agendar Visita ao Gabinete</CardTitle>
            <CardDescription>
              Olá, {visit.contact?.nome}! Por favor, preencha os dados abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataNascimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataNascimento ? (
                        format(dataNascimento, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataNascimento}
                      onSelect={setDataNascimento}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Textarea
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Digite seu endereço completo"
                  required
                  rows={3}
                />
              </div>
              
              {/* Instagram */}
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram (opcional)</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@seu_instagram"
                />
              </div>
              
              {/* Facebook */}
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook (opcional)</Label>
                <Input
                  id="facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="Nome do perfil"
                />
              </div>
              
              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="aceitaReuniao"
                    checked={aceitaReuniao}
                    onCheckedChange={(checked) => setAceitaReuniao(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="aceitaReuniao"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Aceita uma reunião futura?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Gostaríamos de agendar uma conversa com você
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="continuaProjeto"
                    checked={continuaProjeto}
                    onCheckedChange={(checked) => setContinuaProjeto(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="continuaProjeto"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Gostaria de continuar acompanhando nosso projeto?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receba atualizações sobre nossas iniciativas
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Alguma informação adicional que gostaria de compartilhar?"
                  rows={4}
                />
              </div>
              
              {/* Botão Submit */}
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
