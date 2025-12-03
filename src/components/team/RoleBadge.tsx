import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: "Super Admin",
    className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  },
  super_user: {
    label: "Super Usuário",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100",
  },
  admin: {
    label: "Administrador",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  atendente: {
    label: "Atendente",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  checkin_operator: {
    label: "Operador Check-in",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || {
    label: role,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      {config.label}
    </Badge>
  );
}
