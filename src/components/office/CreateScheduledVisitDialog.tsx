import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOfficeCities } from "@/hooks/office/useOfficeCities";
import { useOfficeLeaders } from "@/hooks/office/useOfficeLeaders";
import { useCreateScheduledVisit } from "@/hooks/office/useScheduledVisits";
import { PhoneInput } from "@/components/office/PhoneInput";
import { Loader2, CalendarIcon, Clock, Send } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/urlHelper";

interface CreateScheduledVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

export function CreateScheduledVisitDialog({ open, onOpenChange, initialDate }: CreateScheduledVisitDialogProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [leaderId, setLeaderId] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>(initialDate || addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [sendingSms, setSendingSms] = useState(false);

  const { data: cities = [] } = useOfficeCities();
  const { data: leaders = [] } = useOfficeLeaders();
  const createVisit = useCreateScheduledVisit();

  const resetForm = () => {
    setNome("");
    setTelefone("");
    setCidadeId("");
    setLeaderId(undefined);
    setDate(initialDate || addDays(new Date(), 1));
    setTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !telefone || !cidadeId || !date || !time) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const result = await createVisit.mutateAsync({
        nome,
        telefone,
        cidadeId,
        leaderId,
        scheduledDate: format(date, "yyyy-MM-dd"),
        scheduledTime: time,
      });

      // Enviar SMS automaticamente
      setSendingSms(true);
      
      const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });
      const formattedTime = time;
      const linkFormulario = `${getBaseUrl()}/visita-gabinete/${result.id}`;

      const { error: smsError } = await supabase.functions.invoke("send-sms", {
        body: {
          phone: telefone,
          templateSlug: "visita-agendada-link-formulario",
          variables: {
            nome: nome.split(" ")[0],
            data_agendada: formattedDate,
            hora_agendada: formattedTime,
            link_formulario: linkFormulario,
            protocolo: result.protocolo,
          },
        },
      });

      if (smsError) {
        console.error("Erro ao enviar SMS:", smsError);
        toast.warning("Visita agendada, mas erro ao enviar SMS");
      } else {
        toast.success(`Visita agendada para ${formattedDate} às ${formattedTime}. SMS enviado!`);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar visita:", error);
      toast.error("Erro ao agendar visita");
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar Nova Visita</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do visitante"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">WhatsApp *</Label>
            <PhoneInput
              value={telefone}
              onValueChange={setTelefone}
              placeholder="(61) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Select value={cidadeId} onValueChange={setCidadeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Líder (opcional)</Label>
            <Select value={leaderId || "none"} onValueChange={(v) => setLeaderId(v === "none" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o líder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem líder</SelectItem>
                {leaders.map((leader) => (
                  <SelectItem key={leader.id} value={leader.id}>
                    {leader.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date()}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <Select value={time} onValueChange={setTime} required>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createVisit.isPending || sendingSms}>
              {createVisit.isPending || sendingSms ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sendingSms ? "Enviando SMS..." : "Agendando..."}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Agendar e Enviar SMS
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
