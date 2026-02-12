import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEventRegistrations, useUpdateCheckIn } from "@/hooks/events/useEventRegistrations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, Users, UserCheck, Copy, QrCode, KeyRound, Lock,
  Calendar, Clock, MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CoordinatorEventDetailsDialogProps {
  event: any;
  onClose: () => void;
}

export function CoordinatorEventDetailsDialog({ event, onClose }: CoordinatorEventDetailsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pin, setPin] = useState("");
  const [isPinValidated, setIsPinValidated] = useState(false);
  const [isValidatingPin, setIsValidatingPin] = useState(false);
  const [pinError, setPinError] = useState("");

  const { data: registrations = [], isLoading } = useEventRegistrations(event.id);
  const updateCheckIn = useUpdateCheckIn();

  const checkedInCount = registrations.filter((r: any) => r.checked_in).length;
  const pendingCount = registrations.length - checkedInCount;

  const filteredRegistrations = registrations.filter((reg: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      reg.nome?.toLowerCase().includes(search) ||
      reg.email?.toLowerCase().includes(search) ||
      reg.whatsapp?.includes(search)
    );
  });

  const handleValidatePin = async () => {
    if (!pin.trim()) {
      setPinError("Digite o PIN de acesso");
      return;
    }

    setIsValidatingPin(true);
    setPinError("");

    try {
      const { data: isValid, error } = await supabase.rpc("validate_checkin_pin", {
        _event_id: event.id,
        _pin: pin.trim(),
      });

      if (error) throw error;

      if (isValid) {
        sessionStorage.setItem(`checkin_pin_${event.id}`, pin.trim());
        setIsPinValidated(true);
        toast.success("PIN validado! Agora você pode fazer check-ins.");
      } else {
        setPinError("PIN inválido.");
      }
    } catch (err) {
      console.error("Error validating PIN:", err);
      setPinError("Erro ao validar PIN.");
    } finally {
      setIsValidatingPin(false);
    }
  };

  // Check if PIN was already validated in this session
  const wasPinValidated = isPinValidated || !!sessionStorage.getItem(`checkin_pin_${event.id}`);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(event.date)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold">{registrations.length}</p>
                <p className="text-xs text-muted-foreground">Inscritos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
                <p className="text-xs text-muted-foreground">Check-ins</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </CardContent>
            </Card>
          </div>

          {/* PIN Section for Check-in */}
          {!wasPinValidated && event.status === "active" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Desbloquear Check-in</p>
                    <p className="text-xs text-muted-foreground">Digite o PIN do evento para poder fazer check-ins nesta tela.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, ""));
                        setPinError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleValidatePin();
                      }}
                      placeholder="000000"
                      className="pl-10 text-center text-lg tracking-widest font-mono"
                    />
                  </div>
                  <Button onClick={handleValidatePin} disabled={isValidatingPin || pin.length < 6}>
                    {isValidatingPin ? "..." : "Validar"}
                  </Button>
                </div>
                {pinError && <p className="text-sm text-destructive mt-1">{pinError}</p>}
              </CardContent>
            </Card>
          )}

          {wasPinValidated && (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
              <UserCheck className="h-3 w-3" /> Check-in desbloqueado
            </Badge>
          )}

          {/* Registrations List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Inscrições</CardTitle>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Carregando...</p>
              ) : registrations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma inscrição ainda</p>
              ) : filteredRegistrations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum resultado para "{searchTerm}"</p>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {searchTerm && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {filteredRegistrations.length} resultado(s)
                    </p>
                  )}
                  {filteredRegistrations.map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{reg.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{reg.email}</p>
                        <p className="text-xs text-muted-foreground">{reg.whatsapp}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {reg.checked_in ? (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Presente
                          </Badge>
                        ) : wasPinValidated ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCheckIn.mutate({ id: reg.id, checked_in: true })}
                            disabled={updateCheckIn.isPending}
                          >
                            Fazer Check-in
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Pendente</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
