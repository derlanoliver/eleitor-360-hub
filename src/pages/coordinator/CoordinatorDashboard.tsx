import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCoordinatorAuth } from "@/contexts/CoordinatorAuthContext";
import { useCoordinatorDashboard } from "@/hooks/coordinator/useCoordinatorDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Users, Calendar, MessageSquare, LogOut, Star,
  CheckCircle, Clock, GitBranch, Plus, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { maskPhone } from "@/lib/maskPhone";
import {
  DEFAULT_LEVELS,
  getLeaderLevel,
  getNextLevel,
  getPointsToNextLevel,
  getProgressToNextLevel,
} from "@/hooks/leaders/useLeaderLevels";
import logo from "@/assets/logo-rafael-prudente.png";

export default function CoordinatorDashboard() {
  const { session, logout, isAuthenticated } = useCoordinatorAuth();
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useCoordinatorDashboard(session?.leader_id);

  useEffect(() => {
    if (!isAuthenticated) navigate("/coordenador/login", { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !session) return null;

  const levels = DEFAULT_LEVELS;
  const points = session.pontuacao_total;
  const level = getLeaderLevel(points, levels);
  const nextLevel = getNextLevel(points, levels);
  const pointsToNext = getPointsToNextLevel(points, levels);
  const progress = getProgressToNextLevel(points, levels);

  const subordinates = (dashboard?.subordinates as any[]) || [];
  const eventsParticipated = (dashboard?.events_participated as any[]) || [];
  const eventsCreated = (dashboard?.events_created as any[]) || [];
  const communications = (dashboard?.communications as any[]) || [];
  const treeTotals = dashboard?.tree_totals || { total_members: 0, total_points: 0, total_cadastros: 0 };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(new Date(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return "—"; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8" />
            <div>
              <p className="font-semibold text-sm">{session.nome_completo}</p>
              <p className="text-xs text-muted-foreground">{session.cidade_nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/coordenador/eventos")}>
              <Plus className="h-4 w-4 mr-1" /> Eventos
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { logout(); navigate("/coordenador/login"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status & Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${level.bgClass} ${level.borderClass} border-2`}>
                {level.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{level.name}</h2>
                  <Badge variant="secondary">{points} pontos</Badge>
                </div>
                {nextLevel ? (
                  <p className="text-sm text-muted-foreground">
                    Faltam {pointsToNext} pontos para {nextLevel.name} {nextLevel.icon}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nível máximo atingido!</p>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{points}</p>
              <p className="text-xs text-muted-foreground">Pontos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{session.cadastros}</p>
              <p className="text-xs text-muted-foreground">Cadastros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <GitBranch className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{treeTotals.total_members}</p>
              <p className="text-xs text-muted-foreground">Rede Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{treeTotals.total_points}</p>
              <p className="text-xs text-muted-foreground">Pontos da Rede</p>
            </CardContent>
          </Card>
        </div>

        {/* Subordinates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" /> Indicações ({subordinates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : subordinates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma indicação ainda.</p>
            ) : (
              <div className="space-y-3">
                {subordinates.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {sub.is_verified ? (
                        <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{sub.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">
                          {maskPhone(sub.telefone)} · {formatDate(sub.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{sub.pontuacao_total} pts</p>
                      <p className="text-xs text-muted-foreground">{sub.cadastros} cadastros</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events Created */}
        {eventsCreated.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" /> Eventos Criados ({eventsCreated.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventsCreated.map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(ev.date)} · {ev.location}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{ev.registrations_count || 0} inscritos</p>
                      <p className="text-xs text-muted-foreground">{ev.checkedin_count || 0} check-ins</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events Participated */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" /> Eventos Participados ({eventsParticipated.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsParticipated.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
            ) : (
              <div className="space-y-2">
                {eventsParticipated.map((ev: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(ev.date)}</p>
                    </div>
                    {ev.checked_in ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" /> Check-in
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" /> Inscrito
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" /> Comunicações ({communications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {communications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma comunicação registrada.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {communications.slice(0, 20).map((comm: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{comm.channel}</Badge>
                      <p className="text-sm truncate max-w-[200px]">{comm.subject || "—"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(comm.sent_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
