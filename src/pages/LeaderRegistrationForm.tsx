import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { User, MapPin, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { trackLead, pushToDataLayer } from "@/lib/trackingUtils";
import { normalizePhoneToE164 } from "@/utils/phoneNormalizer";
import { sendVerificationMessage } from "@/hooks/contacts/useContactVerification";
import logo from "@/assets/logo-rafael-prudente.png";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  email: z.string().email("E-mail inválido").max(255),
  whatsapp: z.string().min(10, "WhatsApp inválido").max(15),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  cidade_id: z.string().min(1, "Selecione sua região"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres").max(500),
  consentimento: z.boolean().refine(val => val === true, "Você deve aceitar os termos")
});

type FormData = z.infer<typeof formSchema>;

export default function LeaderRegistrationForm() {
  const { leaderToken } = useParams<{ leaderToken: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Buscar líder pelo affiliate_token
  const { data: leader, isLoading: leaderLoading, error: leaderError } = useQuery({
    queryKey: ["leader_by_token", leaderToken],
    queryFn: async () => {
      if (!leaderToken) return null;
      
      // Usar função RPC SECURITY DEFINER para buscar líder (bypassa RLS para usuários públicos)
      const { data, error } = await supabase
        .rpc("get_leader_by_affiliate_token", { _token: leaderToken });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      // Mapear para estrutura esperada pelo componente
      return {
        id: data[0].id,
        nome_completo: data[0].nome_completo,
        cidade_id: data[0].cidade_id,
        cidade: { nome: data[0].cidade_nome }
      };
    },
    enabled: !!leaderToken
  });

  // Buscar cidades (regiões do DF)
  const { data: cities = [] } = useQuery({
    queryKey: ["office_cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_cities")
        .select("id, nome")
        .eq("status", "active")
        .order("nome");
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar configurações via secure RPC (only safe columns - no API credentials)
  const { data: settings } = useQuery({
    queryKey: ["public_form_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_form_settings");
      if (error) throw error;
      return data?.[0] || null;
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      whatsapp: "",
      data_nascimento: "",
      cidade_id: "",
      endereco: "",
      consentimento: false
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!leader) return;

    setIsSubmitting(true);
    try {
      // Normalizar telefone
      const telefone_norm = normalizePhoneToE164(data.whatsapp);

      // Verificar se a pessoa já é um líder cadastrado
      const { data: existingLeader } = await supabase
        .from("lideres")
        .select("id, nome_completo")
        .or(`telefone.eq.${telefone_norm},email.eq.${data.email.trim().toLowerCase()}`)
        .eq("is_active", true)
        .maybeSingle();

      if (existingLeader) {
        toast.info(`${existingLeader.nome_completo}, você já é uma liderança cadastrada!`);
        setIsSuccess(true);
        setNeedsVerification(false);
        setIsSubmitting(false);
        return;
      }

      // Verificar se já existe contato com este telefone
      const { data: existingContact } = await supabase
        .from("office_contacts")
        .select("id, nome, is_verified, verification_code, source_type, source_id")
        .eq("telefone_norm", telefone_norm)
        .maybeSingle();

      let contactId: string;
      let verificationCode: string;

      if (existingContact) {
        // Contato já existe - atualizar dados se necessário
        const updateData: Record<string, unknown> = {
          nome: data.nome.trim(),
          email: data.email.trim(),
          data_nascimento: data.data_nascimento,
          cidade_id: data.cidade_id,
          endereco: data.endereco.trim(),
        };

        // Se não tinha source_type='lider', atualizar
        if (existingContact.source_type !== 'lider') {
          updateData.source_type = 'lider';
          updateData.source_id = leader.id;
        }

        const { error: updateError } = await supabase
          .from("office_contacts")
          .update(updateData)
          .eq("id", existingContact.id);

        if (updateError) throw updateError;

        contactId = existingContact.id;

        // Se já está verificado, não precisa de verificação
        if (existingContact.is_verified) {
          // Já verificado - sucesso normal
          setIsSuccess(true);
          toast.success("Cadastro atualizado com sucesso!");
          
          // Tracking
          trackLead({ content_name: "leader_registration" });
          pushToDataLayer("lead_registration", { 
            source: "leader_referral",
            leader_id: leader.id 
          });
          return;
        }

        // Não está verificado - gerar código se não tiver
        if (!existingContact.verification_code) {
          const { data: newCode } = await supabase.rpc("generate_verification_code");
          verificationCode = newCode;
          
          await supabase
            .from("office_contacts")
            .update({ verification_code: verificationCode })
            .eq("id", contactId);
        } else {
          verificationCode = existingContact.verification_code;
        }
      } else {
        // Novo contato - inserir com código de verificação (trigger gera automaticamente)
        const { data: contact, error } = await supabase
          .from("office_contacts")
          .insert({
            nome: data.nome.trim(),
            email: data.email.trim(),
            telefone_norm,
            data_nascimento: data.data_nascimento,
            cidade_id: data.cidade_id,
            endereco: data.endereco.trim(),
            source_type: "lider",
            source_id: leader.id,
            is_verified: false,
          })
          .select('id, verification_code')
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.error("Este telefone ou e-mail já está cadastrado.");
          } else {
            throw error;
          }
          return;
        }

        contactId = contact.id;
        verificationCode = contact.verification_code;
      }

      // Record page view for this contact
      await supabase.from('contact_page_views').insert({
        contact_id: contactId,
        page_type: 'link_lider',
        page_identifier: leaderToken || '',
        page_name: `Cadastro via ${leader.nome_completo}`,
      });

      // Enviar mensagem de verificação
      await sendVerificationMessage({
        contactId,
        contactName: data.nome.trim(),
        contactPhone: telefone_norm,
        leaderName: leader.nome_completo,
        verificationCode,
      });

      // Tracking
      trackLead({ content_name: "leader_registration" });
      pushToDataLayer("lead_registration", { 
        source: "leader_referral",
        leader_id: leader.id 
      });

      setNeedsVerification(true);
      setIsSuccess(true);
      toast.success("Cadastro realizado! Verifique seu WhatsApp para confirmar.");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast.error("Erro ao realizar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (leaderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Líder não encontrado
  if (!leader || leaderError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <img src={logo} alt="Logo" className="h-16 mb-6" />
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">Link Inválido</h2>
            <p className="text-muted-foreground">
              Este link de cadastro não é válido ou o líder não está mais ativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de sucesso
  if (isSuccess) {
    // Verificar se é líder (não precisa de verificação porque já é líder)
    const isAlreadyLeader = !needsVerification;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            {needsVerification ? (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Quase Lá!</h2>
                <p className="text-muted-foreground mb-4">
                  Enviamos um código de verificação para seu WhatsApp. 
                  <strong> Responda a mensagem com o código</strong> para confirmar seu cadastro.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">⚠️ Importante</p>
                  <p>Seu cadastro só será confirmado após a verificação. Verifique seu WhatsApp!</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {isAlreadyLeader ? "Você já é uma Liderança!" : "Cadastro Atualizado!"}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {isAlreadyLeader 
                    ? "Identificamos que você já faz parte da nossa rede de lideranças. Continue engajado!"
                    : "Seus dados foram atualizados com sucesso!"
                  }
                </p>
              </>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Indicado por: <strong>{leader.nome_completo}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cityName = leader.cidade && typeof leader.cidade === 'object' && 'nome' in leader.cidade 
    ? (leader.cidade as { nome: string }).nome 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Cover Image with Fade and Centered Logo */}
      <div className="relative h-56 md:h-72 w-full overflow-hidden">
        {/* Background image or gradient */}
        {settings?.affiliate_form_cover_url ? (
          <img 
            src={settings.affiliate_form_cover_url} 
            alt="Capa"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60" />
        )}
        
        {/* Fade effect - gradient from bottom to top */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Centered Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={settings?.affiliate_form_logo_url || logo} 
            alt="Logo" 
            className="h-20 md:h-24 drop-shadow-lg object-contain"
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 -mt-8">

        {/* Leader Info */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indicado por</p>
                <p className="font-semibold text-foreground">{leader.nome_completo}</p>
                {cityName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {cityName}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Formulário de Cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp *</FormLabel>
                      <FormControl>
                        <Input placeholder="(61) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Região do DF *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sua região" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Rua, número, complemento, bairro, CEP" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consentimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Concordo com os termos de uso e política de privacidade (LGPD). 
                          Autorizo o armazenamento e uso dos meus dados para contato.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Cadastro"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Seus dados estão protegidos pela Lei Geral de Proteção de Dados (LGPD).
        </p>
      </div>
    </div>
  );
}