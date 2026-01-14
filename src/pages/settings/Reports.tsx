import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileSpreadsheet, BarChart3, MessageSquare, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useConsolidatedStats } from "@/hooks/reports/useConsolidatedStats";
import { CommunicationReportTab } from "@/components/reports/CommunicationReportTab";
import { EventsReportTab } from "@/components/reports/EventsReportTab";
import { LeadersReportTab } from "@/components/reports/LeadersReportTab";
import { OverviewReportTab } from "@/components/reports/OverviewReportTab";

const Reports = () => {
  const { data: stats, isLoading } = useConsolidatedStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Configurações
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Visualize métricas consolidadas de comunicações, eventos e líderes
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comunicação</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="leaders" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Líderes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewReportTab stats={stats} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="communication">
          <CommunicationReportTab />
        </TabsContent>

        <TabsContent value="events">
          <EventsReportTab />
        </TabsContent>

        <TabsContent value="leaders">
          <LeadersReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
