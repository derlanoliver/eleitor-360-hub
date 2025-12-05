import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOfficeCities } from "@/hooks/office/useOfficeCities";
import { usePublicFormSettings } from "@/hooks/usePublicFormSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { normalizePhoneToE164 } from "@/utils/phoneNormalizer";

const formSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  cidade_id: z.string().min(1, "Selecione uma região"),
  data_nascimento: z.date({ required_error: "Data de nascimento obrigatória" }),
  observacao: z.string().min(10, "Observação deve ter pelo menos 10 caracteres"),
  lgpd: z.boolean().refine((val) => val === true, "Você deve aceitar os termos"),
});

type FormData = z.infer<typeof formSchema>;

export default function PublicLeaderRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: cities } = useOfficeCities();
  const { data: settings } = usePublicFormSettings();

  const activeCities = cities?.filter((c) => c.status === "active") || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      cidade_id: "",
      observacao: "",
      lgpd: false,
    },
  });

  const coverUrl = settings?.leader_form_cover_url || settings?.affiliate_form_cover_url;
  const logoUrl = settings?.leader_form_logo_url || settings?.affiliate_form_logo_url;
  const title = settings?.leader_form_title || "Cadastro de Liderança";
  const subtitle = settings?.leader_form_subtitle || "Faça parte da nossa rede de lideranças e contribua para transformar nossa região.";

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const normalizedPhone = normalizePhoneToE164(data.telefone);

      const { error } = await supabase.from("lideres").insert({
        nome_completo: data.nome_completo.trim(),
        email: data.email.trim().toLowerCase(),
        telefone: normalizedPhone,
        cidade_id: data.cidade_id,
        data_nascimento: format(data.data_nascimento, "yyyy-MM-dd"),
        observacao: data.observacao.trim(),
        is_active: true,
        status: "active",
      });

      if (error) throw error;

      // Get the created leader to obtain the affiliate_token
      const { data: createdLeader } = await supabase
        .from("lideres")
        .select("affiliate_token")
        .eq("email", data.email.trim().toLowerCase())
        .single();

      const affiliateToken = createdLeader?.affiliate_token;

      // Send WhatsApp confirmation (lider-cadastro-confirmado)
      try {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            phone: normalizedPhone,
            templateSlug: 'lider-cadastro-confirmado',
            variables: {
              nome: data.nome_completo,
            },
          },
        });
      } catch (whatsappError) {
        console.error('Error sending WhatsApp confirmation:', whatsappError);
        // Don't fail the submission if WhatsApp fails
      }

      // Send welcome email (lideranca-boas-vindas)
      if (affiliateToken) {
        try {
          const { getBaseUrl } = await import("@/lib/urlHelper");
          await supabase.functions.invoke('send-email', {
            body: {
              to: data.email.trim().toLowerCase(),
              toName: data.nome_completo,
              templateSlug: 'lideranca-boas-vindas',
              variables: {
                nome: data.nome_completo,
                link_indicacao: `${getBaseUrl()}/cadastro/${affiliateToken}`,
              },
            },
          });
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // Don't fail the submission if email fails
        }
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Erro ao cadastrar líder:", error);
      form.setError("root", {
        message: error.message || "Erro ao realizar cadastro. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        {/* Cover com fade */}
        <div
          className="relative h-64 md:h-80 lg:h-96 bg-cover bg-center"
          style={{
            backgroundImage: coverUrl
              ? `url(${coverUrl})`
              : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          {logoUrl && (
            <div className="absolute top-6 left-0 right-0 flex justify-center">
              <img src={logoUrl} alt="Logo" className="h-16 md:h-20 object-contain" />
            </div>
          )}
        </div>

        {/* Conteúdo de sucesso */}
        <div className="container max-w-lg mx-auto px-4 -mt-32 relative z-10">
          <Card className="shadow-xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Cadastro Realizado!
              </h2>
              <p className="text-muted-foreground">
                Seu cadastro foi enviado com sucesso. Em breve entraremos em contato.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover com fade */}
      <div
        className="relative h-64 md:h-80 lg:h-96 bg-cover bg-center"
        style={{
          backgroundImage: coverUrl
            ? `url(${coverUrl})`
            : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Logo */}
        {logoUrl && (
          <div className="absolute top-6 left-0 right-0 flex justify-center">
            <img src={logoUrl} alt="Logo" className="h-16 md:h-20 object-contain" />
          </div>
        )}

        {/* Título e subtítulo no cover */}
        <div className="absolute bottom-8 left-0 right-0 px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground max-w-md mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Formulário */}
      <div className="container max-w-lg mx-auto px-4 -mt-8 relative z-10 pb-12">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Preencha seus dados</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome_completo"
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
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
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
                  name="cidade_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Região Administrativa *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sua região" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeCities.map((city) => (
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
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1920-01-01")
                            }
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1920}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação / Motivação *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conte-nos um pouco sobre você e sua motivação para fazer parte da rede de lideranças..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lgpd"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Concordo com o tratamento dos meus dados pessoais conforme a LGPD *
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <p className="text-sm text-destructive text-center">
                    {form.formState.errors.root.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
