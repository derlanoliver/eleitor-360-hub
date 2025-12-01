import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SourceBreakdown {
  source: string;
  sourceType: "leader" | "event" | "campaign" | "manual" | "visit";
  count: number;
  percentage: number;
  details?: string;
}

export interface LeaderAttribution {
  id: string;
  name: string;
  city: string | null;
  totalCadastros: number;
  contactsFromLink: number;
  eventRegistrations: number;
  officeVisits: number;
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
    totalContacts: number;
    fromLeaders: number;
    fromEvents: number;
    fromCampaigns: number;
    fromManual: number;
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
        fromLeaders: 0,
        fromEvents: 0,
        fromCampaigns: 0,
        fromManual: 0,
        totalEventRegistrations: 0,
        totalOfficeVisits: 0,
        activeLeaders: 0,
        activeCampaigns: 0,
      };

      // Buscar dados manualmente
      const [
        { count: totalContacts },
        { count: fromLeaders },
        { count: fromEvents },
        { count: fromManual },
        { count: totalEventRegistrations },
        { count: totalOfficeVisits },
        { count: activeLeaders },
        { count: activeCampaigns },
      ] = await Promise.all([
        supabase.from("office_contacts").select("*", { count: "exact", head: true }),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).eq("source_type", "lider"),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).eq("source_type", "evento"),
        supabase.from("office_contacts").select("*", { count: "exact", head: true }).or("source_type.eq.manual,source_type.is.null"),
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

      summary = {
        totalContacts: totalContacts || 0,
        fromLeaders: fromLeaders || 0,
        fromEvents: fromEvents || 0,
        fromCampaigns: fromCampaigns || 0,
        fromManual: fromManual || 0,
        totalEventRegistrations: totalEventRegistrations || 0,
        totalOfficeVisits: totalOfficeVisits || 0,
        activeLeaders: activeLeaders || 0,
        activeCampaigns: activeCampaigns || 0,
      };

      // 2. Buscar breakdown por fonte
      const sourceBreakdown: SourceBreakdown[] = [];
      const total = summary.totalContacts || 1;

      if (summary.fromLeaders > 0) {
        sourceBreakdown.push({
          source: "Links de Líderes",
          sourceType: "leader",
          count: summary.fromLeaders,
          percentage: Math.round((summary.fromLeaders / total) * 100),
          details: "Cadastros via link de indicação",
        });
      }

      if (summary.fromEvents > 0) {
        sourceBreakdown.push({
          source: "Eventos",
          sourceType: "event",
          count: summary.fromEvents,
          percentage: Math.round((summary.fromEvents / total) * 100),
          details: "Inscrições em eventos",
        });
      }

      if (summary.fromCampaigns > 0) {
        sourceBreakdown.push({
          source: "Campanhas UTM",
          sourceType: "campaign",
          count: summary.fromCampaigns,
          percentage: Math.round((summary.fromCampaigns / total) * 100),
          details: "Cadastros rastreados via UTM",
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

      // Ordenar por quantidade
      sourceBreakdown.sort((a, b) => b.count - a.count);

      // 3. Buscar top líderes
      const { data: leadersData } = await supabase
        .from("lideres")
        .select(`
          id,
          nome_completo,
          cadastros,
          cidade:office_cities(nome)
        `)
        .eq("is_active", true)
        .gt("cadastros", 0)
        .order("cadastros", { ascending: false })
        .limit(10);

      const topLeaders: LeaderAttribution[] = await Promise.all(
        (leadersData || []).map(async (leader) => {
          const [{ count: contactsFromLink }, { count: eventRegistrations }, { count: officeVisits }] =
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

          return {
            id: leader.id,
            name: leader.nome_completo,
            city: leader.cidade && typeof leader.cidade === "object" && "nome" in leader.cidade
              ? (leader.cidade as { nome: string }).nome
              : null,
            totalCadastros: leader.cadastros,
            contactsFromLink: contactsFromLink || 0,
            eventRegistrations: eventRegistrations || 0,
            officeVisits: officeVisits || 0,
          };
        })
      );

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

      // 5. Buscar tendência mensal (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const { data: monthlyData } = await supabase
        .from("office_contacts")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString());

      const monthlyCount: Record<string, number> = {};
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      (monthlyData || []).forEach((contact) => {
        const date = new Date(contact.created_at);
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
