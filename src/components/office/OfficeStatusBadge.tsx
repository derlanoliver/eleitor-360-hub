import { Badge } from "@/components/ui/badge";
import type { OfficeVisitStatus } from "@/types/office";

const STATUS_CONFIG: Record<OfficeVisitStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  REGISTERED: { label: "Registrado", variant: "secondary" },
  LINK_SENT: { label: "Link Enviado", variant: "default" },
  FORM_OPENED: { label: "Form Aberto", variant: "outline" },
  FORM_SUBMITTED: { label: "Form Enviado", variant: "default" },
  CHECKED_IN: { label: "Check-in Feito", variant: "default" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
  MEETING_COMPLETED: { label: "Reunião Realizada", variant: "default" },
  RESCHEDULED: { label: "Reagendada", variant: "secondary" }
};

interface OfficeStatusBadgeProps {
  status: OfficeVisitStatus;
  className?: string;
}

export function OfficeStatusBadge({ status, className }: OfficeStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
