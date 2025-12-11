import { Crown, Users, Award, ChevronRight, MoreVertical, UserMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Coordinator, CoordinatorStats } from "@/hooks/leaders/useLeaderTree";

interface CoordinatorCardProps {
  coordinator: Coordinator;
  stats?: CoordinatorStats | null;
  isSelected: boolean;
  onSelect: () => void;
  onDemote: () => void;
}

export function CoordinatorCard({ 
  coordinator, 
  stats, 
  isSelected, 
  onSelect,
  onDemote 
}: CoordinatorCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? "ring-2 ring-primary border-primary bg-primary/5" 
          : "hover:border-primary/50 hover:shadow-sm"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0" onClick={onSelect}>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{coordinator.nome_completo}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {coordinator.cidade?.nome || "Sem região"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDemote} className="text-destructive">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Rebaixar Coordenador
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onSelect}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? "rotate-90" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {stats?.total_leaders ?? 0} líderes
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Award className="h-3 w-3" />
            {stats?.total_pontos ?? coordinator.pontuacao_total} pts
          </Badge>
          <Badge variant="outline" className="gap-1">
            {stats?.total_cadastros ?? coordinator.cadastros} cadastros
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
