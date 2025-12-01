import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Download, CheckCircle, Shield, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLeadFunnelBySlug, useIncrementFunnelMetric } from "@/hooks/campaigns/useLeadFunnels";
import { useOfficeCities } from "@/hooks/office/useOfficeCities";
import { supabase } from "@/integrations/supabase/client";
import { trackLead, pushToDataLayer, trackEvent } from "@/lib/trackingUtils";
import { normalizePhoneToE164 } from "@/utils/phoneNormalizer";
import { toast } from "@/hooks/use-toast";

export default function LeadCaptureLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  
  const { data: funnel, isLoading, error } = useLeadFunnelBySlug(slug);
  const { data: cities } = useOfficeCities();
  const incrementMetric = useIncrementFunnelMetric();

  // Get UTM params
  const utmParams = {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
  };

  // Track page view
  useEffect(() => {
    if (funnel && !hasTrackedView) {
      // Increment view count
      incrementMetric.mutate({ funnelId: funnel.id, metric: 'views' });
      
      // Track in page_views
      supabase.from('page_views').insert({
        page_type: 'captacao',
        page_identifier: funnel.slug,
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
        ...utmParams,
      });

      // Facebook Pixel ViewContent
      trackEvent('ViewContent', {
        content_name: funnel.nome,
        content_type: 'lead_funnel',
      });

      // GTM
      pushToDataLayer('view_content', {
        funnel_name: funnel.nome,
        funnel_slug: funnel.slug,
      });

      setHasTrackedView(true);
    }
  }, [funnel, hasTrackedView]);

  // Build dynamic schema based on funnel fields
  const buildSchema = () => {
    const fields: Record<string, z.ZodTypeAny> = {
      nome: z.string().min(3, "Nome é obrigatório"),
      email: z.string().email("E-mail inválido"),
      lgpd: z.boolean().refine(val => val === true, "Você precisa aceitar os termos"),
    };

    if (funnel?.campos_form.includes('whatsapp')) {
      fields.whatsapp = z.string().min(10, "WhatsApp inválido");
    }
    if (funnel?.campos_form.includes('cidade')) {
      fields.cidade_id = z.string().optional();
    }

    return z.object(fields);
  };

  const form = useForm({
    resolver: funnel ? zodResolver(buildSchema()) : undefined,
    defaultValues: {
      nome: '',
      email: '',
      whatsapp: '',
      cidade_id: '',
      lgpd: false,
    },
  });

  const onSubmit = async (data: any) => {
    if (!funnel) return;
    
    setIsSubmitting(true);

    try {
      // Normalize phone if provided
      let telefone_norm: string | null = null;
      if (data.whatsapp) {
        try {
          telefone_norm = normalizePhoneToE164(data.whatsapp);
        } catch {
          telefone_norm = '+5500000000000'; // Fallback
        }
      }

      // Save to office_contacts
      const { error: contactError } = await supabase
        .from('office_contacts')
        .insert({
          nome: data.nome,
          email: data.email,
          telefone_norm: telefone_norm || '+5500000000000', // Fallback if no phone
          cidade_id: data.cidade_id || null,
          source_type: 'captacao',
          source_id: funnel.id,
          ...utmParams,
        });

      if (contactError) throw contactError;

      // Increment lead count
      await incrementMetric.mutateAsync({ funnelId: funnel.id, metric: 'leads' });

      // Track Lead event
      trackLead({
        content_name: funnel.nome,
        value: 1,
      });

      pushToDataLayer('generate_lead', {
        funnel_name: funnel.nome,
        funnel_slug: funnel.slug,
        lead_source: utmParams.utm_source || 'direct',
      });

      setIsSuccess(true);
    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!funnel) return;

    // Track download event
    trackEvent('Download', {
      content_name: funnel.lead_magnet_nome,
    });

    pushToDataLayer('download', {
      funnel_name: funnel.nome,
      lead_magnet: funnel.lead_magnet_nome,
    });

    // Use tracked download via edge function
    const downloadUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-material?funnel_id=${funnel.id}`;
    window.open(downloadUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share && funnel) {
      try {
        await navigator.share({
          title: funnel.titulo,
          text: funnel.subtitulo || '',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share not supported
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground">Este link não está mais disponível.</p>
      </div>
    );
  }

  // Success state - Thank you page
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Cover with logo */}
        <div 
          className="h-48 md:h-56 relative bg-gradient-to-br from-primary/20 to-primary/5"
          style={funnel.cover_url ? {
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${funnel.cover_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          {funnel.logo_url && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2">
              <img 
                src={funnel.logo_url} 
                alt="Logo" 
                className="h-16 md:h-20 w-auto bg-white/90 rounded-xl p-2 shadow-lg"
              />
            </div>
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">
              {funnel.obrigado_titulo}
            </h1>
            {funnel.obrigado_subtitulo && (
              <p className="text-muted-foreground">
                {funnel.obrigado_subtitulo}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Download Button */}
            <Button 
              size="lg" 
              className="w-full text-lg py-6"
              style={{ backgroundColor: funnel.cor_botao }}
              onClick={handleDownload}
            >
              <Download className="h-5 w-5 mr-2" />
              {funnel.obrigado_texto_botao}
            </Button>

            {/* Additional CTA */}
            {funnel.cta_adicional_texto && funnel.cta_adicional_url && (
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => window.open(funnel.cta_adicional_url!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {funnel.cta_adicional_texto}
              </Button>
            )}

            {/* Share buttons */}
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>

          {/* Lead magnet name */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground">
              🎁 <strong>{funnel.lead_magnet_nome}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Cover with title, subtitle, and logo inside */}
      <div 
        className="h-64 md:h-80 lg:h-96 relative bg-gradient-to-br from-primary/20 to-primary/5"
        style={funnel.cover_url ? {
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(${funnel.cover_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {/* Logo at top */}
        {funnel.logo_url && (
          <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2">
            <img 
              src={funnel.logo_url} 
              alt="Logo" 
              className="h-14 md:h-16 w-auto bg-white/90 rounded-xl p-2 shadow-lg"
            />
          </div>
        )}
        
        {/* Title and subtitle centered in cover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-3 drop-shadow-lg ${funnel.cover_url ? 'text-white' : 'text-foreground'}`}>
            {funnel.titulo}
          </h1>
          {funnel.subtitulo && (
            <p className={`text-base md:text-lg max-w-md drop-shadow ${funnel.cover_url ? 'text-white/90' : 'text-muted-foreground'}`}>
              {funnel.subtitulo}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8 pb-12">

        {/* Lead magnet preview */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
          <span className="text-2xl">🎁</span>
          <p className="font-medium mt-1">{funnel.lead_magnet_nome}</p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
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

            {funnel.campos_form.includes('whatsapp') && (
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(61) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {funnel.campos_form.includes('cidade') && cities && (
              <FormField
                control={form.control}
                name="cidade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade/Região Administrativa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione sua cidade" />
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
            )}

            <FormField
              control={form.control}
              name="lgpd"
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
                      Concordo em receber comunicações e aceito a política de privacidade *
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              size="lg" 
              className="w-full text-lg py-6"
              style={{ backgroundColor: funnel.cor_botao }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                funnel.texto_botao
              )}
            </Button>
          </form>
        </Form>

        {/* Security indicator */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Seus dados estão seguros e protegidos</span>
        </div>
      </div>
    </div>
  );
}