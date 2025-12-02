import { Clock, Check, CheckCheck, X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusBadgeProps {
  status: string;
  direction: string;
  className?: string;
}

export function MessageStatusBadge({ status, direction, className }: MessageStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          label: "Pendente",
          bgColor: "bg-muted",
          textColor: "text-muted-foreground",
        };
      case "sent":
        return {
          icon: Check,
          label: "Enviada",
          bgColor: "bg-green-50",
          textColor: "text-green-600",
        };
      case "delivered":
        return {
          icon: CheckCheck,
          label: "Entregue",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
        };
      case "read":
        return {
          icon: CheckCheck,
          label: "Lida",
          bgColor: "bg-blue-50",
          textColor: "text-blue-600",
        };
      case "failed":
        return {
          icon: X,
          label: "Falhou",
          bgColor: "bg-red-50",
          textColor: "text-red-600",
        };
      default:
        return {
          icon: Clock,
          label: status,
          bgColor: "bg-muted",
          textColor: "text-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          config.bgColor,
          config.textColor
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    </div>
  );
}

export function DirectionBadge({ direction }: { direction: string }) {
  const isOutgoing = direction === "outgoing";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-full",
        isOutgoing ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
      )}
    >
      {isOutgoing ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownLeft className="h-3.5 w-3.5" />
      )}
    </span>
  );
}
