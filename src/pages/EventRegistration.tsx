import { useParams, useSearchParams } from "react-router-dom";
import { useEvent } from "@/hooks/events/useEvents";
import { useCreateRegistration } from "@/hooks/events/useEventRegistrations";
import { useOfficeCities } from "@/hooks/office/useOfficeCities";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, CheckCircle2, QrCode, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCodeComponent from "qrcode";
import { getBaseUrl } from "@/lib/urlHelper";
import { trackLead, pushToDataLayer } from "@/lib/trackingUtils";

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
  const { data: event, isLoading } = useEvent(slug || "");
  const { data: cities } = useOfficeCities();
  const createRegistration = useCreateRegistration();
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    cidade_id: "",
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;

    try {
      const registration = await createRegistration.mutateAsync({
        event_id: event.id,
        nome: formData.nome,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cidade_id: formData.cidade_id || undefined,
        utm_source: searchParams.get("utm_source") || undefined,
        utm_medium: searchParams.get("utm_medium") || undefined,
        utm_campaign: searchParams.get("utm_campaign") || undefined,
        utm_content: searchParams.get("utm_content") || undefined,
      });

      // Generate QR Code with full URL for check-in
      const checkInUrl = `${getBaseUrl()}/checkin/${registration.qr_code}`;
      const qrData = await QRCodeComponent.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrData);
      setRegistrationSuccess(true);

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
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Inscrição Confirmada!</CardTitle>
            <CardDescription>
              Sua inscrição no evento <strong>{event.name}</strong> foi realizada com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Use este QR Code para fazer check-in no evento:
              </p>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto border-4 border-border rounded-lg" />
              )}
            </div>
            
            {/* Aviso importante sobre o QR Code */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
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
                  {event.capacity - event.registrations_count} vagas restantes
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

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.registrations_count} inscritos
                    </span>
                    <span>{event.capacity} vagas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
