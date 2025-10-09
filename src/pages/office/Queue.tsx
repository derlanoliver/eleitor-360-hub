import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOfficeVisits } from "@/hooks/office/useOfficeVisits";
import { Loader2, Clock, Send, FileText, CheckCircle } from "lucide-react";
import { OfficeStatusBadge } from "@/components/office/OfficeStatusBadge";
import { ProtocolBadge } from "@/components/office/ProtocolBadge";
import { formatPhoneBR } from "@/services/office/officeService";

export default function Queue() {
  const { data: visits, isLoading } = useOfficeVisits();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Agrupar por status
  const registered = visits?.filter((v) => v.status === "REGISTERED" || v.status === "LINK_SENT") || [];
  const opened = visits?.filter((v) => v.status === "FORM_OPENED") || [];
  const submitted = visits?.filter((v) => v.status === "FORM_SUBMITTED") || [];
  const checkedIn = visits?.filter((v) => v.status === "CHECKED_IN") || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Fila do Dia</h1>
        <p className="text-muted-foreground">
          Acompanhe o status das visitas em tempo real
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Aguardando preenchimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Aguardando Preenchimento
            </CardTitle>
            <CardDescription>{registered.length} visitas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {registered.map((visit) => (
              <div key={visit.id} className="p-3 bg-muted rounded-lg space-y-2">
                <ProtocolBadge protocolo={visit.protocolo} showCopy={false} />
                <p className="font-medium text-sm">{visit.contact?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {visit.contact?.telefone_norm && formatPhoneBR(visit.contact.telefone_norm)}
                </p>
                <OfficeStatusBadge status={visit.status} />
              </div>
            ))}
            {registered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma visita aguardando
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Form Aberto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Form Aberto
            </CardTitle>
            <CardDescription>{opened.length} visitas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {opened.map((visit) => (
              <div key={visit.id} className="p-3 bg-muted rounded-lg space-y-2">
                <ProtocolBadge protocolo={visit.protocolo} showCopy={false} />
                <p className="font-medium text-sm">{visit.contact?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {visit.contact?.telefone_norm && formatPhoneBR(visit.contact.telefone_norm)}
                </p>
                <OfficeStatusBadge status={visit.status} />
              </div>
            ))}
            {opened.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum form aberto
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Form Enviado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Form Enviado
            </CardTitle>
            <CardDescription>{submitted.length} visitas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {submitted.map((visit) => (
              <div key={visit.id} className="p-3 bg-muted rounded-lg space-y-2">
                <ProtocolBadge protocolo={visit.protocolo} showCopy={false} />
                <p className="font-medium text-sm">{visit.contact?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {visit.contact?.telefone_norm && formatPhoneBR(visit.contact.telefone_norm)}
                </p>
                <OfficeStatusBadge status={visit.status} />
              </div>
            ))}
            {submitted.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum form enviado
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Check-in Realizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Check-in Realizado
            </CardTitle>
            <CardDescription>{checkedIn.length} visitas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkedIn.map((visit) => (
              <div key={visit.id} className="p-3 bg-muted rounded-lg space-y-2">
                <ProtocolBadge protocolo={visit.protocolo} showCopy={false} />
                <p className="font-medium text-sm">{visit.contact?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {visit.contact?.telefone_norm && formatPhoneBR(visit.contact.telefone_norm)}
                </p>
                <OfficeStatusBadge status={visit.status} />
              </div>
            ))}
            {checkedIn.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum check-in ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
