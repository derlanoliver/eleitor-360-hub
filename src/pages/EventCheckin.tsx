import { useParams } from "react-router-dom";
import { useRegistrationByQR, useUpdateCheckInByQR } from "@/hooks/events/useRegistrationByQR";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Calendar, Clock, MapPin, User, CalendarX2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isEventDeadlinePassed } from "@/lib/eventUtils";

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

export default function EventCheckin() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const { data: registration, isLoading, error } = useRegistrationByQR(qrCode || "");
  const updateCheckIn = useUpdateCheckInByQR();

  const handleCheckIn = async () => {
    if (!qrCode) return;
    await updateCheckIn.mutateAsync({ qrCode, checked_in: true });
  };

  const handleUndoCheckIn = async () => {
    if (!qrCode) return;
    await updateCheckIn.mutateAsync({ qrCode, checked_in: false });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle>QR Code Inválido</CardTitle>
            <CardDescription>
              Não foi possível encontrar uma inscrição com este QR Code.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const categoryInfo = eventCategories[registration.event_category as keyof typeof eventCategories] || {
    label: registration.event_category || "",
    color: "bg-gray-500",
  };

  const isCheckedIn = registration.checked_in;
  
  // Verificar se já passou 4 horas do horário do evento
  const isCheckinClosed = registration.event_date && registration.event_time 
    ? isEventDeadlinePassed(registration.event_date, registration.event_time)
    : false;

  // Se o prazo de check-in passou, mostrar mensagem
  if (isCheckinClosed && !isCheckedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CalendarX2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Check-in Não Disponível</CardTitle>
            <CardDescription>
              O período de check-in para este evento foi encerrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold">{registration.event_name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {registration.event_date && format(new Date(registration.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {registration.event_time && ` às ${registration.event_time}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
                {isCheckedIn && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Check-in Realizado
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{registration.event_name}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Event Info */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Informações do Evento</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{registration.event_date ? format(new Date(registration.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Data não disponível"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{registration.event_time || "Horário não disponível"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{registration.event_location || "Local não disponível"}</span>
              </div>
              {registration.event_address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{registration.event_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Participant Info */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Informações do Participante</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{registration.nome}</span>
              </div>
            </div>
          </div>

          {/* Check-in Status */}
          {isCheckedIn && registration.checked_in_at && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Check-in confirmado</p>
                  <p className="text-sm">
                    {format(new Date(registration.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isCheckedIn ? (
              <Button 
                onClick={handleCheckIn} 
                disabled={updateCheckIn.isPending}
                className="flex-1"
                size="lg"
              >
                {updateCheckIn.isPending ? "Confirmando..." : "Confirmar Presença"}
              </Button>
            ) : (
              <Button 
                onClick={handleUndoCheckIn} 
                disabled={updateCheckIn.isPending}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {updateCheckIn.isPending ? "Desfazendo..." : "Desfazer Check-in"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
