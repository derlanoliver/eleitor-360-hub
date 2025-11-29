import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface EventExportData {
  events: any[];
  leadersRanking: any[];
  citiesStats: any[];
  categoryStats: any[];
  stats: any;
}

export function exportEventsToExcel(data: EventExportData) {
  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo Geral
  const summaryData = [
    ["Métrica", "Valor"],
    ["Total de Eventos", data.stats.totalEvents],
    ["Eventos Ativos", data.stats.activeEvents],
    ["Total de Inscrições", data.stats.totalRegistrations],
    ["Total de Check-ins", data.stats.totalCheckins],
    ["Taxa de Conversão Geral", `${data.stats.overallConversionRate.toFixed(1)}%`],
    ["Utilização de Capacidade", `${data.stats.averageCapacityUtilization.toFixed(1)}%`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo Geral");

  // Aba 2: Eventos
  const eventsData = data.events.map((event) => ({
    Nome: event.name,
    Data: format(new Date(event.date), "dd/MM/yyyy"),
    Categoria: event.category,
    Região: event.region,
    Inscrições: event.registrations_count || 0,
    "Check-ins": event.checkedin_count || 0,
    "Taxa de Conversão": `${
      event.registrations_count > 0
        ? ((event.checkedin_count || 0) / event.registrations_count * 100).toFixed(1)
        : 0
    }%`,
    Capacidade: event.capacity || 0,
    Status: event.status,
  }));
  const eventsSheet = XLSX.utils.json_to_sheet(eventsData);
  XLSX.utils.book_append_sheet(workbook, eventsSheet, "Eventos");

  // Aba 3: Ranking de Líderes
  const leadersData = data.leadersRanking.map((leader) => ({
    Nome: leader.leaderName,
    Cidade: leader.cityName || "N/A",
    Inscrições: leader.registrations,
    "Check-ins": leader.checkins,
    "Taxa de Conversão": `${leader.conversionRate.toFixed(1)}%`,
  }));
  const leadersSheet = XLSX.utils.json_to_sheet(leadersData);
  XLSX.utils.book_append_sheet(workbook, leadersSheet, "Ranking de Líderes");

  // Aba 4: Distribuição por Cidade
  const citiesData = data.citiesStats.map((city) => ({
    Cidade: city.cityName,
    Inscrições: city.registrations,
    "Check-ins": city.checkins,
    "Taxa de Conversão": `${city.conversionRate.toFixed(1)}%`,
  }));
  const citiesSheet = XLSX.utils.json_to_sheet(citiesData);
  XLSX.utils.book_append_sheet(workbook, citiesSheet, "Cidades");

  // Aba 5: Métricas por Categoria
  const categoriesData = data.categoryStats.map((cat) => ({
    Categoria: cat.categoryLabel,
    Eventos: cat.totalEvents,
    Inscrições: cat.totalRegistrations,
    "Check-ins": cat.totalCheckins,
    "Taxa de Conversão": `${cat.conversionRate.toFixed(1)}%`,
    "Média por Evento": cat.averageRegistrationsPerEvent.toFixed(1),
  }));
  const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
  XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categorias");

  // Download
  const fileName = `relatorio-eventos-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportReportsToPdf(data: {
  stats: any;
  events: any[];
  leadersRanking: any[];
}) {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text("Relatório de Eventos", 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 28);

  // KPIs Principais
  doc.setFontSize(14);
  doc.text("Métricas Principais", 14, 40);
  doc.setFontSize(10);

  const kpis = [
    ["Total de Eventos", data.stats.totalEvents.toString()],
    ["Eventos Ativos", data.stats.activeEvents.toString()],
    ["Total de Inscrições", data.stats.totalRegistrations.toString()],
    ["Total de Check-ins", data.stats.totalCheckins.toString()],
    [
      "Taxa de Conversão Geral",
      `${data.stats.overallConversionRate.toFixed(1)}%`,
    ],
    [
      "Utilização de Capacidade",
      `${data.stats.averageCapacityUtilization.toFixed(1)}%`,
    ],
  ];

  autoTable(doc, {
    startY: 45,
    head: [["Métrica", "Valor"]],
    body: kpis,
    theme: "grid",
    styles: { fontSize: 9 },
  });

  // Top 10 Eventos
  doc.setFontSize(14);
  const finalY1 = (doc as any).lastAutoTable.finalY || 90;
  doc.text("Top 10 Eventos (Por Inscrições)", 14, finalY1 + 15);

  const topEvents = data.events
    .sort((a, b) => (b.registrations_count || 0) - (a.registrations_count || 0))
    .slice(0, 10)
    .map((event) => [
      event.name,
      format(new Date(event.date), "dd/MM/yyyy"),
      (event.registrations_count || 0).toString(),
      (event.checkedin_count || 0).toString(),
      `${
        event.registrations_count > 0
          ? ((event.checkedin_count || 0) / event.registrations_count * 100).toFixed(1)
          : 0
      }%`,
    ]);

  const finalY2 = (doc as any).lastAutoTable.finalY || 90;
  autoTable(doc, {
    startY: finalY2 + 20,
    head: [["Evento", "Data", "Inscrições", "Check-ins", "Conversão"]],
    body: topEvents,
    theme: "striped",
    styles: { fontSize: 8 },
  });

  // Ranking de Líderes
  const finalY3 = (doc as any).lastAutoTable.finalY || 140;
  if (finalY3 > 240) {
    doc.addPage();
  }

  doc.setFontSize(14);
  doc.text(
    "Ranking de Líderes",
    14,
    finalY3 > 240 ? 20 : finalY3 + 15
  );

  const leadersData = data.leadersRanking.slice(0, 10).map((leader, idx) => [
    (idx + 1).toString(),
    leader.leaderName,
    leader.cityName || "N/A",
    leader.registrations.toString(),
    leader.checkins.toString(),
    `${leader.conversionRate.toFixed(1)}%`,
  ]);

  const finalY4 = (doc as any).lastAutoTable.finalY || 140;
  autoTable(doc, {
    startY: finalY4 > 240 ? 25 : finalY4 + 20,
    head: [["#", "Nome", "Cidade", "Inscrições", "Check-ins", "Conversão"]],
    body: leadersData,
    theme: "striped",
    styles: { fontSize: 8 },
  });

  // Download
  const fileName = `relatorio-eventos-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
