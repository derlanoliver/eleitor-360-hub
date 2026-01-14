import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, Users, CheckCircle2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

export function EventsReportTab() {
  const [period, setPeriod] = useState("30");

  // Buscar estatísticas de eventos
  const { data: eventStats } = useQuery({
    queryKey: ['event_stats_report'],
    queryFn: async () => {
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalRegistrations } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalCheckins } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('checked_in', true);

      // Evento mais popular
      const { data: popularEvent } = await supabase
        .from('events')
        .select('name, registrations_count')
        .order('registrations_count', { ascending: false })
        .limit(1)
        .single();

      // Melhor taxa de conversão
      const { data: eventsWithStats } = await supabase
        .from('events')
        .select('name, registrations_count, checkedin_count')
        .gt('registrations_count', 0);

      let bestConversion = { name: '', rate: 0 };
      if (eventsWithStats) {
        eventsWithStats.forEach(event => {
          const rate = ((event.checkedin_count || 0) / (event.registrations_count || 1)) * 100;
          if (rate > bestConversion.rate) {
            bestConversion = { name: event.name, rate };
          }
        });
      }

      const conversionRate = (totalRegistrations || 0) > 0 
        ? ((totalCheckins || 0) / (totalRegistrations || 1)) * 100 
        : 0;

      return {
        totalEvents: totalEvents || 0,
        totalRegistrations: totalRegistrations || 0,
        totalCheckins: totalCheckins || 0,
        conversionRate,
        popularEvent: popularEvent?.name || 'N/A',
        popularEventCount: popularEvent?.registrations_count || 0,
        bestConversion
      };
    }
  });

  // Buscar evolução de inscrições
  const { data: registrationTrend } = useQuery({
    queryKey: ['registration_trend', period],
    queryFn: async () => {
      const daysAgo = parseInt(period);
      const startDate = subDays(new Date(), daysAgo).toISOString();

      const { data } = await supabase
        .from('event_registrations')
        .select('created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      // Agrupar por dia
      const grouped: Record<string, number> = {};
      data?.forEach(reg => {
        const date = format(new Date(reg.created_at || ''), 'dd/MM', { locale: ptBR });
        grouped[date] = (grouped[date] || 0) + 1;
      });

      return Object.entries(grouped).map(([date, count]) => ({ date, inscricoes: count }));
    }
  });

  // Buscar top eventos
  const { data: topEvents } = useQuery({
    queryKey: ['top_events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('name, registrations_count, checkedin_count')
        .order('registrations_count', { ascending: false })
        .limit(5);

      return data?.map(event => ({
        name: event.name.length > 20 ? event.name.substring(0, 20) + '...' : event.name,
        inscricoes: event.registrations_count || 0,
        checkins: event.checkedin_count || 0
      })) || [];
    }
  });

  const handleExport = () => {
    const data = [
      ['Métrica', 'Valor'],
      ['Total de Eventos', eventStats?.totalEvents || 0],
      ['Total de Inscrições', eventStats?.totalRegistrations || 0],
      ['Total de Check-ins', eventStats?.totalCheckins || 0],
      ['Taxa de Conversão', `${eventStats?.conversionRate?.toFixed(1) || 0}%`],
      ['Evento mais popular', eventStats?.popularEvent || 'N/A'],
      [],
      ['Evento', 'Inscrições', 'Check-ins'],
      ...(topEvents?.map(e => [e.name, e.inscricoes, e.checkins]) || [])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Eventos');
    XLSX.writeFile(wb, `relatorio-eventos-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Exportação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats?.totalEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscrições</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats?.totalRegistrations?.toLocaleString('pt-BR') || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats?.totalCheckins?.toLocaleString('pt-BR') || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{eventStats?.conversionRate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">🏆 Evento Mais Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{eventStats?.popularEvent || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              {eventStats?.popularEventCount?.toLocaleString('pt-BR') || 0} inscrições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">🎯 Melhor Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{eventStats?.bestConversion?.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              {eventStats?.bestConversion?.rate?.toFixed(1) || 0}% de conversão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Inscrições</CardTitle>
            <CardDescription>Número de inscrições por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="inscricoes" stroke="hsl(15 89% 54%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Eventos</CardTitle>
            <CardDescription>Eventos com mais inscrições</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEvents || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inscricoes" name="Inscrições" fill="#3B82F6" />
                  <Bar dataKey="checkins" name="Check-ins" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
