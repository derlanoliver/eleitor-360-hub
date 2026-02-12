import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2, XCircle, TrendingUp, MapPin, UserCheck, RefreshCcw, Crown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { EventDetailedReport } from "@/hooks/reports/useEventDetailedReport";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  report: EventDetailedReport;
  eventName: string;
  isLoading?: boolean;
  coordinatorName?: string | null;
}

const PROFILE_COLORS = {
  contacts: "hsl(var(--muted-foreground))",
  leaders: "hsl(15 89% 54%)",
  coordinators: "hsl(142 76% 36%)"
};

const PROFILE_LABELS = {
  contacts: "Contatos",
  leaders: "Líderes",
  coordinators: "Coordenadores"
};

export function EventDetailedReportPanel({ report, eventName, isLoading, coordinatorName }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const profileData = [
    { name: 'Contatos', value: report.profileBreakdown.contacts, color: PROFILE_COLORS.contacts },
    { name: 'Líderes', value: report.profileBreakdown.leaders, color: PROFILE_COLORS.leaders },
    { name: 'Coordenadores', value: report.profileBreakdown.coordinators, color: PROFILE_COLORS.coordinators }
  ].filter(d => d.value > 0);

  const getProfileBadge = (type: 'contact' | 'leader' | 'coordinator') => {
    switch (type) {
      case 'coordinator':
        return <Badge className="bg-green-600">Coordenador</Badge>;
      case 'leader':
        return <Badge className="bg-orange-500">Líder</Badge>;
      default:
        return <Badge variant="secondary">Contato</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicador de coordenador criador */}
      {coordinatorName && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Evento criado pelo coordenador: <strong>{coordinatorName}</strong></span>
        </div>
      )}

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscritos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalRegistrations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{report.totalCheckins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ausentes</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{report.totalAbsent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de 2 colunas para Origem e Perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origem dos Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Origem dos Participantes
            </CardTitle>
            <CardDescription>Distribuição por cidade</CardDescription>
          </CardHeader>
          <CardContent>
            {report.citiesBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-4">
                {report.citiesBreakdown.slice(0, 10).map((city, idx) => (
                  <div key={city.cityId || idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{city.cityName}</span>
                      <span className="text-muted-foreground">
                        {city.registrations} inscritos • {city.checkins} check-ins ({city.conversionRate.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={city.conversionRate} className="h-2" />
                  </div>
                ))}
                {report.citiesBreakdown.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{report.citiesBreakdown.length - 10} outras cidades
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Perfil dos Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Perfil dos Participantes
            </CardTitle>
            <CardDescription>Classificação por tipo de cadastro</CardDescription>
          </CardHeader>
          <CardContent>
            {profileData.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-[220px] w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={profileData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={70}
                        labelLine={false}
                      >
                        {profileData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ paddingTop: 12 }}
                        formatter={(value: string) => {
                          const item = profileData.find(d => d.name === value);
                          const total = profileData.reduce((s, d) => s + d.value, 0);
                          const pct = total > 0 && item ? ((item.value / total) * 100).toFixed(0) : '0';
                          return <span className="text-sm text-muted-foreground">{value} ({pct}%)</span>;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 w-full md:w-1/2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>Contatos</span>
                    <span className="font-bold">{report.profileBreakdown.contacts}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded">
                    <span className="text-orange-600">Líderes</span>
                    <span className="font-bold text-orange-600">{report.profileBreakdown.leaders}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                    <span className="text-green-600">Coordenadores</span>
                    <span className="font-bold text-green-600">{report.profileBreakdown.coordinators}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recorrência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Recorrência de Participação
          </CardTitle>
          <CardDescription>Análise de participação em outros eventos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{report.recurrenceStats.firstTimers}</div>
              <div className="text-sm text-muted-foreground">Primeira vez</div>
              <div className="text-xs text-muted-foreground">
                ({report.totalRegistrations > 0 ? ((report.recurrenceStats.firstTimers / report.totalRegistrations) * 100).toFixed(0) : 0}%)
              </div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary">{report.recurrenceStats.recurring}</div>
              <div className="text-sm text-muted-foreground">Recorrentes</div>
              <div className="text-xs text-muted-foreground">
                ({report.totalRegistrations > 0 ? ((report.recurrenceStats.recurring / report.totalRegistrations) * 100).toFixed(0) : 0}%)
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{report.recurrenceStats.averageEventsPerParticipant.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Média de eventos/participante</div>
            </div>
          </div>

          {report.recurrenceStats.topRecurring.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Top Participantes Recorrentes</h4>
              <div className="space-y-2">
                {report.recurrenceStats.topRecurring.map((participant, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium">{idx + 1}. {participant.nome}</span>
                      <p className="text-xs text-muted-foreground">{participant.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{participant.eventsCount} eventos</Badge>
                      {participant.eventNames.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                          {participant.eventNames.slice(0, 3).join(', ')}
                          {participant.eventNames.length > 3 && ` +${participant.eventNames.length - 3}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Detalhada de Inscritos</CardTitle>
          <CardDescription>
            {report.totalRegistrations} inscritos no total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Líder Superior</TableHead>
                  <TableHead>Outros Eventos</TableHead>
                  <TableHead>Inscrito em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.registrations.slice(0, 50).map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reg.nome}</p>
                        <p className="text-xs text-muted-foreground">{reg.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reg.cityName || 'N/A'}</TableCell>
                    <TableCell>
                      {reg.checkedIn ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Check-in
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Ausente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getProfileBadge(reg.profileType)}</TableCell>
                    <TableCell>
                      {reg.profileType !== 'contact' && reg.parentLeaderName ? (
                        <span className="text-sm">{reg.parentLeaderName}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {reg.otherEventsCount > 0 ? (
                        <div>
                          <Badge variant="outline">{reg.otherEventsCount + 1} eventos</Badge>
                          {reg.otherEventNames.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                              {reg.otherEventNames[0]}
                              {reg.otherEventNames.length > 1 && ` +${reg.otherEventNames.length - 1}`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Primeira vez</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reg.createdAt ? format(new Date(reg.createdAt), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {report.registrations.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Mostrando 50 de {report.registrations.length} inscritos. Exporte para Excel para ver todos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
