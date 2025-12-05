import { useParams, useSearchParams } from "react-router-dom";
import { useEvent } from "@/hooks/events/useEvents";
import { useCreateRegistration } from "@/hooks/events/useEventRegistrations";
import { useOfficeCities } from "@/hooks/office/useOfficeCities";
import { useLeaderByToken } from "@/hooks/events/useLeaderByToken";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, CheckCircle2, AlertTriangle, UserCheck, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCodeComponent from "qrcode";
import { getBaseUrl } from "@/lib/urlHelper";
import { trackLead, pushToDataLayer } from "@/lib/trackingUtils";
import { normalizePhoneToE164 } from "@/utils/phoneNormalizer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendVerificationMessage, addPendingMessage } from "@/hooks/contacts/useContactVerification";

const eventCategories = {
  educacao: { label: "Educação", color: "bg-blue-500" },
  saude: { label: "Saúde", color: "bg-green-500" },
  seguranca: { label: "Segurança", color: "bg-red-500" },
  infraestrutura: { label: "Infraestrutura", color: "bg-yellow-500" },
  cultura: { label: "Cultura", color: "bg-purple-500" },
  esporte: { label: "Esporte", color: "bg-orange-500" },
  meio_ambiente: { label: "Meio Ambiente", color: "bg-teal-500" },
  desenvolvimento: { label: "Desenvolvimento", color: "bg-indigo-500" },
};

export default function EventRegistration() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const affiliateToken = searchParams.get("ref");
  
  const { data: event, isLoading } = useEvent(slug || "");
  const { data: cities } = useOfficeCities();
  const { data: leader } = useLeaderByToken(affiliateToken || undefined);
  const createRegistration = useCreateRegistration();
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    cidade_id: "",
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Registrar page view quando a página carrega
  useEffect(() => {
    const registerPageView = async () => {
      if (!event || !slug) return;
      
      // Flag para evitar duplicação na mesma sessão para mesmo evento
      const viewKey = `pageview_${slug}`;
      if (sessionStorage.getItem(viewKey)) return;
      
      // Gerar ou recuperar session_id para evitar contagem duplicada
      let sessionId = sessionStorage.getItem('visitor_session');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('visitor_session', sessionId);
      }
      
      // Registrar visualização
      const { error } = await supabase.from('page_views').insert({
        page_type: 'event',
        page_identifier: slug,
        utm_source: searchParams.get("utm_source"),
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
        utm_content: searchParams.get("utm_content"),
        session_id: sessionId
      });
      
      if (error) {
        console.error('Erro ao registrar page view:', error);
      } else {
        // Marcar que já registramos visualização para este evento nesta sessão
        sessionStorage.setItem(viewKey, 'true');
      }
    };
    
    registerPageView();
  }, [event, slug, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;

    try {
      const normalizedPhone = normalizePhoneToE164(formData.whatsapp);
      const hasLeaderRef = !!leader;

      // Se tem referência de líder, verificar se contato existe e está verificado
      let existingContact = null;
      let needsVerificationCheck = false;

      if (hasLeaderRef) {
        const { data: contactData } = await supabase
          .from("office_contacts")
          .select("id, nome, is_verified, verification_code, source_type, source_id, pending_messages")
          .eq("telefone_norm", normalizedPhone)
          .maybeSingle();

        existingContact = contactData;

        // Se contato existe e não está verificado (e veio de líder), precisa verificar
        if (existingContact && !existingContact.is_verified && existingContact.source_type === 'lider') {
          needsVerificationCheck = true;
        }
        // Se é novo contato via líder, também precisa verificar
        if (!existingContact) {
          needsVerificationCheck = true;
        }
      }

      // Criar registro do evento
      const registration = await createRegistration.mutateAsync({
        event_id: event.id,
        nome: formData.nome,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cidade_id: formData.cidade_id || undefined,
        leader_id: leader?.id || undefined,
        utm_source: searchParams.get("utm_source") || undefined,
        utm_medium: searchParams.get("utm_medium") || undefined,
        utm_campaign: searchParams.get("utm_campaign") || undefined,
        utm_content: searchParams.get("utm_content") || undefined,
      });

      // Page view tracking is now handled by the trigger/function

      // Generate QR Code with full URL for check-in
      const checkInUrl = `${getBaseUrl()}/checkin/${registration.qr_code}`;
      const qrData = await QRCodeComponent.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrData);

      // QR Code URL para email (usando Google Charts API para compatibilidade)
      const qrCodeImageUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(checkInUrl)}`;

      // Track Lead event
      trackLead({ 
        content_name: `evento_${event.slug}`,
        value: 1
      });
      
      // Push to GTM dataLayer
      pushToDataLayer('lead', { 
        source: 'evento',
        event_id: event.id,
        event_name: event.name,
        event_category: event.category
      });

      const eventDate = format(new Date(event.date), "dd 'de' MMMM", { locale: ptBR });

      // Se tem referência de líder e precisa verificar
      if (hasLeaderRef && needsVerificationCheck) {
        // Buscar contato atualizado (pode ter sido criado pelo createRegistration)
        const { data: contactForVerification } = await supabase
          .from("office_contacts")
          .select("id, is_verified, verification_code, pending_messages")
          .eq("telefone_norm", normalizedPhone)
          .single();

        if (contactForVerification && !contactForVerification.is_verified) {
          // Armazenar mensagens de confirmação como pendentes (WhatsApp e Email)
          let pendingMessages = addPendingMessage(
            contactForVerification.pending_messages || [],
            'evento-inscricao-confirmada',
            {
              nome: formData.nome,
              evento_nome: event.name,
              evento_data: eventDate,
              evento_hora: event.time,
              evento_local: event.location,
            }
          );
          
          // Adicionar email pendente também
          pendingMessages = addPendingMessage(
            pendingMessages,
            'email:evento-cadastro-confirmado',
            {
              nome: formData.nome,
              evento_nome: event.name,
              evento_data: eventDate,
              evento_hora: event.time,
              evento_local: event.location,
              evento_endereco: event.address || event.location,
              evento_descricao: event.description || '',
              qr_code_url: qrCodeImageUrl,
              email: formData.email,
              eventId: event.id,
            }
          );

          await supabase
            .from("office_contacts")
            .update({ pending_messages: JSON.parse(JSON.stringify(pendingMessages)) })
            .eq("id", contactForVerification.id);

          // Gerar código se não tiver
          let verificationCode = contactForVerification.verification_code;
          if (!verificationCode) {
            const { data: newCode } = await supabase.rpc("generate_verification_code");
            verificationCode = newCode;
            
            await supabase
              .from("office_contacts")
              .update({ 
                verification_code: verificationCode,
                source_type: 'lider',
                source_id: leader!.id,
              })
              .eq("id", contactForVerification.id);
          }

          // Enviar mensagem de verificação
          await sendVerificationMessage({
            contactId: contactForVerification.id,
            contactName: formData.nome,
            contactPhone: normalizedPhone,
            leaderName: leader!.nome_completo,
            verificationCode,
          });

          setNeedsVerification(true);
        }
      } else {
        // Sem referência de líder OU contato já verificado - enviar confirmação normalmente
        try {
          await supabase.functions.invoke('send-whatsapp', {
            body: {
              phone: normalizedPhone,
              templateSlug: 'evento-inscricao-confirmada',
              variables: {
                nome: formData.nome,
                evento_nome: event.name,
                evento_data: eventDate,
                evento_hora: event.time,
                evento_local: event.location,
                evento_endereco: event.address || event.location,
              },
              contactId: undefined,
            },
          });
        } catch (whatsappError) {
          console.error('Error sending WhatsApp confirmation:', whatsappError);
        }

        // Enviar email de confirmação
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              templateSlug: 'evento-cadastro-confirmado',
              to: formData.email,
              toName: formData.nome,
              variables: {
                nome: formData.nome,
                evento_nome: event.name,
                evento_data: eventDate,
                evento_hora: event.time,
                evento_local: event.location,
                evento_endereco: event.address || event.location,
                evento_descricao: event.description || '',
                qr_code_url: qrCodeImageUrl,
              },
              eventId: event.id,
            },
          });
        } catch (emailError) {
          console.error('Error sending email confirmation:', emailError);
        }
      }

      setRegistrationSuccess(true);
    } catch (error) {
      console.error("Error creating registration:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Evento não encontrado</CardTitle>
            <CardDescription>
              O evento que você está procurando não existe ou foi removido.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (event.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Evento encerrado</CardTitle>
            <CardDescription>
              Este evento já foi encerrado e não aceita mais inscrições.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (event.registrations_count >= event.capacity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Evento lotado</CardTitle>
            <CardDescription>
              Infelizmente todas as vagas para este evento foram preenchidas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {needsVerification ? (
              <>
                <ShieldCheck className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <CardTitle>Quase Lá!</CardTitle>
                <CardDescription>
                  Sua inscrição no evento <strong>{event.name}</strong> foi registrada!
                </CardDescription>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>Inscrição Confirmada!</CardTitle>
                <CardDescription>
                  Sua inscrição no evento <strong>{event.name}</strong> foi realizada com sucesso!
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {needsVerification && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">Verificação Necessária!</p>
                    <p>Enviamos um código de verificação para seu WhatsApp. Responda com o código para confirmar seu cadastro e receber as informações do evento.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Use este QR Code para fazer check-in no evento:
              </p>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto border-4 border-border rounded-lg" />
              )}
            </div>
            
            {/* Aviso importante sobre o QR Code */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-semibold">Importante!</p>
                  <p>Salve este QR Code! Tire um print ou uma foto para apresentar no dia do evento e garantir seu check-in.</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = eventCategories[event.category as keyof typeof eventCategories] || {
    label: event.category,
    color: "bg-gray-500",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Leader Banner */}
      {leader && (
        <Alert className="m-6 border-primary bg-primary/5">
          <UserCheck className="h-5 w-5 text-primary" />
          <AlertDescription className="text-base">
            <strong>Indicado por:</strong> {leader.nome_completo}
            {leader.cidade && ` - ${leader.cidade.nome}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Cover Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryInfo.color} mb-3`}>
              {categoryInfo.label}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 md:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Event Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Sobre o Evento</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description || "Sem descrição disponível."}
              </p>
            </div>

            {event.address && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Endereço</h2>
                <p className="text-muted-foreground">{event.address}</p>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Inscreva-se
                </CardTitle>
                <CardDescription>
                  {event.show_registrations_count !== false
                    ? `${event.capacity - event.registrations_count} vagas restantes`
                    : "Garanta sua vaga no evento"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      required
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(61) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cidade_id">Cidade</Label>
                    <Select value={formData.cidade_id} onValueChange={(value) => setFormData({ ...formData, cidade_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={createRegistration.isPending}>
                    {createRegistration.isPending ? "Inscrevendo..." : "Confirmar Inscrição"}
                  </Button>
                </form>

                {event.show_registrations_count !== false && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.registrations_count} inscritos
                      </span>
                      <span>{event.capacity} vagas</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}