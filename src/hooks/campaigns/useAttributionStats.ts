import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SourceBreakdown {
  source: string;
  sourceType: "leader" | "event" | "campaign" | "manual" | "visit" | "funnel" | "webhook" | "leader_registration";
  count: number;
  percentage: number;
  details?: string;
}

export interface LeaderAttribution {
  id: string;
  name: string;
  city: string | null;
  contactsReferred: number;    // Contatos indicados via link
  eventRegistrations: number;  // Inscrições em eventos
  officeVisits: number;        // Visitas ao gabinete
  totalInfluence: number;      // Soma total de captações
}

export interface CityDistribution {
  city: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  count: number;
}

export interface AttributionStats {
  summary: {
    totalContacts: number;      // Apenas contatos
    totalLeaders: number;       // Apenas líderes
    grandTotal: number;         // Contatos + Líderes
    fromLeaders: number;
    fromEvents: number;
    fromCampaigns: number;
    fromManual: number;
    fromCaptacao: number;
    fromVisita: number;
    fromWebhook: number;
    totalEventRegistrations: number;
    totalOfficeVisits: number;
    activeLeaders: number;
    activeCampaigns: number;
  };
  sourceBreakdown: SourceBreakdown[];
  topLeaders: LeaderAttribution[];
  cityDistribution: CityDistribution[];
  monthlyTrend: MonthlyTrend[];
  growthPercentage: number;
}

export function useAttributionStats() {
  return useQuery({
    queryKey: ["attribution-stats"],
    queryFn: async (): Promise<AttributionStats> => {
      // 1. Buscar totais gerais
      let summary = {
        totalContacts: 0,
        totalLeaders: 0,
        grandTotal: 0,
        fromLeaders: 0,
        fromEvents: 0,
        fromCampaigns: 0,
        fromManual: 0,
        fromCaptacao: 0,
        fromVisita: 0,
        fromWebhook: 0,
        totalEventRegistrations: 0,
        totalOfficeVisits: 0,
        activeLeaders: 0,
        activeCampaigns: 0,
      };

      // Buscar dados manualmente
      const [
        { count: totalContacts },
        { count: totalLeadersRegistered },
        { count: fromLeaders },
        { count: fromEvents },
        { count: fromManual },
        { count: fromCaptacao },
        { count: fromVisita },
        { count: fromWebhook },
        { count: totalEventRegistrations },
        { count: totalOfficeVisits },
        { count: activeLeaders },
        { count: activeCampaigns },
      ] = await Promise.all([
        supabase.from("office_contacts").select("*", { count: "exact", head: true }),
        supabase.from("lideres").select("*", { count: "exact", head: true }),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).eq("source_type", "lider"),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).eq("source_type", "evento"),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).or("source_type.eq.manual,source_type.is.null"),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).eq("source_type", "captacao"),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).eq("source_type", "visita"),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).eq("source_type", "webhook"),
        supabase.from("event_registrations").select("*", { count: "exact", head: true }),
        supabase.from("office_visits").select("*", { count: "exact", head: true }),
        supabase.from("lideres").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      // Buscar contatos de campanhas (com utm_campaign)
      const { count: fromCampaigns } = await supabase
        .from("office_contacts")
        .select("*", { count: "exact", head: true })
        .not("utm_campaign", "is", null);

      const contactsCount = totalContacts || 0;
      const leadersCount = totalLeadersRegistered || 0;

      summary = {
        totalContacts: contactsCount,
        totalLeaders: leadersCount,
        grandTotal: contactsCount + leadersCount,
        fromLeaders: fromLeaders || 0,
        fromEvents: fromEvents || 0,
        fromCampaigns: fromCampaigns || 0,
        fromManual: fromManual || 0,
        fromCaptacao: fromCaptacao || 0,
        fromVisita: fromVisita || 0,
        fromWebhook: fromWebhook || 0,
        totalEventRegistrations: totalEventRegistrations || 0,
        totalOfficeVisits: totalOfficeVisits || 0,
        activeLeaders: activeLeaders || 0,
        activeCampaigns: activeCampaigns || 0,
      };

      // 2. Buscar breakdown por fonte
      const sourceBreakdown: SourceBreakdown[] = [];
      const total = summary.grandTotal || 1;

      // Adicionar líderes cadastrados
      if (summary.totalLeaders > 0) {
        sourceBreakdown.push({
          source: "Cadastro de Lideranças",
          sourceType: "leader_registration",
          count: summary.totalLeaders,
          percentage: Math.round((summary.totalLeaders / total) * 100),
          details: "Lideranças cadastradas via formulário ou importação",
        });
      }

      if (summary.fromLeaders > 0) {
        sourceBreakdown.push({
          source: "Links de Líderes",
          sourceType: "leader",
          count: summary.fromLeaders,
          percentage: Math.round((summary.fromLeaders / total) * 100),
          details: "Cadastros via link de indicação de líderes",
        });
      }

      if (summary.fromEvents > 0) {
        sourceBreakdown.push({
          source: "Eventos",
          sourceType: "event",
          count: summary.fromEvents,
          percentage: Math.round((summary.fromEvents / total) * 100),
          details: "Contatos vindos de inscrições em eventos",
        });
      }

      if (summary.fromWebhook > 0) {
        sourceBreakdown.push({
          source: "Integrações Externas",
          sourceType: "webhook",
          count: summary.fromWebhook,
          percentage: Math.round((summary.fromWebhook / total) * 100),
          details: "Cadastros via GreatPages e outras integrações",
        });
      }

      if (summary.fromCampaigns > 0) {
        sourceBreakdown.push({
          source: "Campanhas UTM",
          sourceType: "campaign",
          count: summary.fromCampaigns,
          percentage: Math.round((summary.fromCampaigns / total) * 100),
          details: "Cadastros rastreados via parâmetros UTM",
        });
      }

      if (summary.fromManual > 0) {
        sourceBreakdown.push({
          source: "Cadastro Manual/Importação",
          sourceType: "manual",
          count: summary.fromManual,
          percentage: Math.round((summary.fromManual / total) * 100),
          details: "Importados ou cadastrados manualmente",
        });
      }

      if (summary.fromCaptacao > 0) {
        sourceBreakdown.push({
          source: "Funis de Captação",
          sourceType: "funnel",
          count: summary.fromCaptacao,
          percentage: Math.round((summary.fromCaptacao / total) * 100),
          details: "Leads via páginas de captação",
        });
      }

      if (summary.fromVisita > 0) {
        sourceBreakdown.push({
          source: "Visita ao Gabinete",
          sourceType: "visit",
          count: summary.fromVisita,
          percentage: Math.round((summary.fromVisita / total) * 100),
          details: "Contatos via agendamento de visita",
        });
      }

      // Ordenar por quantidade
      sourceBreakdown.sort((a, b) => b.count - a.count);

      // 3. Buscar top líderes com contagens REAIS
      // Primeiro buscar líderes ativos
      const { data: leadersData } = await supabase
        .from("lideres")
        .select(`
          id,
          nome_completo,
          cidade:office_cities(nome)
        `)
        .eq("is_active", true);

      // Para cada líder, buscar contagens reais
      const leadersWithCounts = await Promise.all(
        (leadersData || []).map(async (leader) => {
          const [{ count: contactsReferred }, { count: eventRegistrations }, { count: officeVisits }] =
            await Promise.all([
              supabase
                .from("office_contacts")
                .select("*", { count: "exact", head: true })
                .eq("source_type", "lider")
                .eq("source_id", leader.id),
              supabase
                .from("event_registrations")
                .select("*", { count: "exact", head: true })
                .eq("leader_id", leader.id),
              supabase
                .from("office_visits")
                .select("*", { count: "exact", head: true })
                .eq("leader_id", leader.id),
            ]);

          const totalInfluence = (contactsReferred || 0) + (eventRegistrations || 0) + (officeVisits || 0);

          return {
            id: leader.id,
            name: leader.nome_completo,
            city: leader.cidade && typeof leader.cidade === "object" && "nome" in leader.cidade
              ? (leader.cidade as { nome: string }).nome
              : null,
            contactsReferred: contactsReferred || 0,
            eventRegistrations: eventRegistrations || 0,
            officeVisits: officeVisits || 0,
            totalInfluence,
          };
        })
      );

      // Filtrar líderes com pelo menos 1 captação e ordenar por total
      const topLeaders: LeaderAttribution[] = leadersWithCounts
        .filter(leader => leader.totalInfluence > 0)
        .sort((a, b) => b.totalInfluence - a.totalInfluence)
        .slice(0, 10);

      // 4. Buscar distribuição por cidade
      const { data: citiesData } = await supabase
        .from("office_contacts")
        .select("cidade_id, office_cities(nome)");

      const cityCount: Record<string, number> = {};
      (citiesData || []).forEach((contact) => {
        const cityName =
          contact.office_cities && typeof contact.office_cities === "object" && "nome" in contact.office_cities
            ? (contact.office_cities as { nome: string }).nome
            : "Sem cidade";
        cityCount[cityName] = (cityCount[cityName] || 0) + 1;
      });

      const cityDistribution: CityDistribution[] = Object.entries(cityCount)
        .map(([city, count]) => ({
          city,
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 5. Buscar tendência mensal (últimos 6 meses) - incluindo contatos E líderes
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const [{ data: monthlyContactsData }, { data: monthlyLeadersData }] = await Promise.all([
        supabase
          .from("office_contacts")
          .select("created_at")
          .gte("created_at", sixMonthsAgo.toISOString()),
        supabase
          .from("lideres")
          .select("created_at")
          .gte("created_at", sixMonthsAgo.toISOString()),
      ]);

      const monthlyCount: Record<string, number> = {};
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      // Contar contatos
      (monthlyContactsData || []).forEach((contact) => {
        const date = new Date(contact.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyCount[key] = (monthlyCount[key] || 0) + 1;
      });

      // Contar líderes também
      (monthlyLeadersData || []).forEach((leader) => {
        const date = new Date(leader.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyCount[key] = (monthlyCount[key] || 0) + 1;
      });

      const monthlyTrend: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyTrend.push({
          month: key,
          monthLabel: `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`,
          count: monthlyCount[key] || 0,
        });
      }

      // 6. Calcular crescimento
      const currentMonth = monthlyTrend[monthlyTrend.length - 1]?.count || 0;
      const previousMonth = monthlyTrend[monthlyTrend.length - 2]?.count || 0;
      const growthPercentage =
        previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : 0;

      return {
        summary,
        sourceBreakdown,
        topLeaders,
        cityDistribution,
        monthlyTrend,
        growthPercentage,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
