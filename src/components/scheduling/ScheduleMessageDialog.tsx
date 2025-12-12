import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Send } from "lucide-react";
import { format, setHours, setMinutes, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (scheduledFor: Date) => void;
  onSendNow: () => void;
  recipientCount: number;
  messageType: "sms" | "email" | "whatsapp";
  isLoading?: boolean;
}

export function ScheduleMessageDialog({
  open,
  onOpenChange,
  onSchedule,
  onSendNow,
  recipientCount,
  messageType,
  isLoading,
}: ScheduleMessageDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");

  const handleSchedule = () => {
    if (!date) {
      toast.error("Selecione uma data");
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDate = setMinutes(setHours(date, hours), minutes);

    if (isBefore(scheduledDate, new Date())) {
      toast.error("A data e hora devem ser no futuro");
      return;
    }

    onSchedule(scheduledDate);
  };

  const messageTypeLabel = {
    sms: "SMS",
    email: "E-mail",
    whatsapp: "WhatsApp",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar {messageTypeLabel[messageType]}</DialogTitle>
          <DialogDescription>
            {recipientCount} destinatário{recipientCount !== 1 ? "s" : ""} selecionado
            {recipientCount !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data do envio</Label>
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
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {date && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p className="font-medium">Agendado para:</p>
              <p className="text-muted-foreground">
                {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })} às {time}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onSendNow}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar Agora
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!date || isLoading}
            className="w-full sm:w-auto"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Agendar Envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
