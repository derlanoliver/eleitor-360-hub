import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOfficeVisits } from "@/hooks/office/useOfficeVisits";
import { Loader2, Clock, Send, FileText, CheckCircle, CheckCircle2, XCircle, CalendarClock, Search } from "lucide-react";
import { OfficeStatusBadge } from "@/components/office/OfficeStatusBadge";
import { ProtocolBadge } from "@/components/office/ProtocolBadge";
import { VisitDetailsDialog } from "@/components/office/VisitDetailsDialog";
import { RescheduleVisitDialog } from "@/components/office/RescheduleVisitDialog";
import { CompleteMeetingDialog } from "@/components/office/CompleteMeetingDialog";
import { MeetingMinutesDialog } from "@/components/office/MeetingMinutesDialog";
import { useVisitMeetingActions } from "@/hooks/office/useVisitMeetingActions";
import { formatPhoneBR } from "@/services/office/officeService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Queue() {
  const { data: visits, isLoading } = useOfficeVisits();
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [rescheduleVisit, setRescheduleVisit] = useState<any>(null);
  const [completeMeetingVisit, setCompleteMeetingVisit] = useState<any>(null);
  const [minutesVisit, setMinutesVisit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { completeMeeting, cancelMeeting, rescheduleMeeting } = useVisitMeetingActions();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Função para normalizar telefone na busca
  const normalizeSearchPhone = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  // Função para filtrar visitas pela busca
  const filterVisits = (visits: any[]) => {
    if (!searchTerm.trim()) return visits;
    
    const term = searchTerm.toLowerCase().trim();
    const termNumbers = normalizeSearchPhone(term);
    
    return visits.filter((visit) => {
      // Busca por protocolo
      const matchProtocol = visit.protocolo?.toLowerCase().includes(term);
      
      // Busca por nome do visitante
      const matchName = visit.contact?.nome?.toLowerCase().includes(term);
      
      // Busca por telefone (normalizado)
      const phoneNorm = visit.contact?.telefone_norm || "";
      const matchPhone = termNumbers.length >= 3 && phoneNorm.includes(termNumbers);
      
      return matchProtocol || matchName || matchPhone;
    });
  };

  // Filtrar apenas visitas ativas (excluir finalizadas)
  const activeStatuses = ["REGISTERED", "LINK_SENT", "FORM_OPENED", "FORM_SUBMITTED", "CHECKED_IN", "RESCHEDULED"];
  const activeVisits = visits?.filter((v) => activeStatuses.includes(v.status)) || [];
  
  // Aplicar filtro de busca
  const filteredVisits = filterVisits(activeVisits);
  
  // Agrupar por status usando visitas filtradas
  const registered = filteredVisits.filter((v) => v.status === "REGISTERED" || v.status === "LINK_SENT");
  const opened = filteredVisits.filter((v) => v.status === "FORM_OPENED");
  
  // Form Enviado: reagendadas primeiro
  const submitted = filteredVisits
    .filter((v) => v.status === "FORM_SUBMITTED" || v.status === "RESCHEDULED")
    .sort((a, b) => {
      if (a.status === "RESCHEDULED" && b.status !== "RESCHEDULED") return -1;
      if (a.status !== "RESCHEDULED" && b.status === "RESCHEDULED") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  
  const checkedIn = filteredVisits.filter((v) => v.status === "CHECKED_IN");
  
  const handleReschedule = (visitId: string, newDate: Date) => {
    rescheduleMeeting.mutate({ visitId, newDate });
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fila do Dia</h1>
          <p className="text-muted-foreground">
            Acompanhe o status das visitas em tempo real
          </p>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredVisits.length} resultado(s) encontrado(s)
            </p>
          )}
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por protocolo, nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
              <div 
                key={visit.id} 
                className="p-3 bg-muted rounded-lg space-y-2 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setSelectedVisit(visit)}
              >
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
              <div 
                key={visit.id} 
                className="p-3 bg-muted rounded-lg space-y-2 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setSelectedVisit(visit)}
              >
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
              <div 
                key={visit.id} 
                className="p-3 bg-muted rounded-lg space-y-2 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setSelectedVisit(visit)}
              >
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
              <div 
                key={visit.id} 
                className="p-3 bg-muted rounded-lg space-y-2"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => setSelectedVisit(visit)}
                >
                  <ProtocolBadge protocolo={visit.protocolo} showCopy={false} />
                  <p className="font-medium text-sm mt-2">{visit.contact?.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {visit.contact?.telefone_norm && formatPhoneBR(visit.contact.telefone_norm)}
                  </p>
                  <OfficeStatusBadge status={visit.status} className="mt-2" />
                </div>
                
                {/* Botões de ação */}
                <TooltipProvider>
                  <div className="flex gap-2 mt-2 pt-2 border-t">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompleteMeetingVisit(visit);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reunião Realizada</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelMeeting.mutate(visit.id);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reunião Cancelada</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRescheduleVisit(visit);
                          }}
                        >
                          <CalendarClock className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reagendar Reunião</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
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
      
      <VisitDetailsDialog
        visit={selectedVisit}
        open={!!selectedVisit}
        onOpenChange={(open) => !open && setSelectedVisit(null)}
      />
      
      <RescheduleVisitDialog
        visit={rescheduleVisit}
        open={!!rescheduleVisit}
        onOpenChange={(open) => !open && setRescheduleVisit(null)}
        onReschedule={handleReschedule}
      />
      
      <CompleteMeetingDialog
        visit={completeMeetingVisit}
        open={!!completeMeetingVisit}
        onOpenChange={(open) => !open && setCompleteMeetingVisit(null)}
        onComplete={(visitId) => {
          completeMeeting.mutate(visitId);
          setCompleteMeetingVisit(null);
        }}
        onRegisterMinutes={(visit) => {
          setCompleteMeetingVisit(null);
          setMinutesVisit(visit);
        }}
      />
      
      <MeetingMinutesDialog
        visit={minutesVisit}
        open={!!minutesVisit}
        onOpenChange={(open) => !open && setMinutesVisit(null)}
      />
    </div>
  );
}
