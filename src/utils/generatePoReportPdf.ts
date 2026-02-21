import jsPDF from "jspdf";
import { format } from "date-fns";
import type { WeeklyReportData, ComparisonReportData, EventReportData, ExecutiveReportData } from "@/hooks/public-opinion/usePoReportData";

const PRIMARY = [240, 80, 35] as const; // #F05023
const LIGHT_BG = [253, 241, 236] as const;
const GRAY = [80, 80, 80] as const;

function createDoc() {
  const doc = new jsPDF();
  return { doc, pageWidth: doc.internal.pageSize.getWidth() };
}

function addHeader(doc: jsPDF, pageWidth: number, title: string, subtitle: string): number {
  let y = 15;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(subtitle, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;
  doc.setTextColor(0, 0, 0);
  return y;
}

function checkPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) { doc.addPage(); return 15; }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
  doc.text(text, 14, y);
  doc.setTextColor(0, 0, 0);
  return y + 8;
}

function addMetricRow(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(label, 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, 80, y);
  return y + 6;
}

// ── 1. Weekly Sentiment Report ──
export function generateWeeklyReport(data: WeeklyReportData) {
  const { doc, pageWidth } = createDoc();
  let y = addHeader(doc, pageWidth, "Relatório Semanal de Sentimento", data.entityName);

  // Metrics
  y = sectionTitle(doc, y, "Métricas dos Últimos 7 Dias");
  y = addMetricRow(doc, y, "Total de Menções:", String(data.total));
  y = addMetricRow(doc, y, "Positivas:", `${data.positive} (${data.total ? Math.round((data.positive / data.total) * 100) : 0}%)`);
  y = addMetricRow(doc, y, "Negativas:", `${data.negative} (${data.total ? Math.round((data.negative / data.total) * 100) : 0}%)`);
  y = addMetricRow(doc, y, "Neutras:", `${data.neutral} (${data.total ? Math.round((data.neutral / data.total) * 100) : 0}%)`);
  y = addMetricRow(doc, y, "Score Médio:", data.avgScore.toFixed(2));
  y += 4;

  // Daily evolution
  if (data.snapshots.length > 0) {
    y = checkPage(doc, y, 40);
    y = sectionTitle(doc, y, "Evolução Diária");
    const colX = [14, 50, 80, 110, 140, 170];
    doc.setFillColor(...PRIMARY);
    doc.rect(14, y - 4, pageWidth - 28, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Data", colX[0] + 2, y);
    doc.text("Total", colX[1] + 2, y);
    doc.text("Positivo", colX[2] + 2, y);
    doc.text("Negativo", colX[3] + 2, y);
    doc.text("Neutro", colX[4] + 2, y);
    doc.text("Score", colX[5] + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 5;

    data.snapshots.forEach((s, i) => {
      y = checkPage(doc, y, 7);
      if (i % 2 === 0) { doc.setFillColor(...LIGHT_BG); doc.rect(14, y - 4, pageWidth - 28, 6, "F"); }
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(format(new Date(s.snapshot_date + "T12:00:00"), "dd/MM"), colX[0] + 2, y);
      doc.text(String(s.total_mentions), colX[1] + 2, y);
      doc.text(String(s.positive_count), colX[2] + 2, y);
      doc.text(String(s.negative_count), colX[3] + 2, y);
      doc.text(String(s.neutral_count), colX[4] + 2, y);
      doc.text(s.avg_sentiment_score?.toFixed(2) || "—", colX[5] + 2, y);
      y += 6;
    });
    y += 4;
  }

  // Top topics
  if (data.topTopics.length > 0) {
    y = checkPage(doc, y, 30);
    y = sectionTitle(doc, y, "Top 5 Tópicos");
    data.topTopics.forEach((t, i) => {
      y = checkPage(doc, y, 6);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}. ${t.name} (${t.count} menções)`, 18, y);
      y += 5;
    });
    y += 4;
  }

  // Top emotions
  if (data.topEmotions.length > 0) {
    y = checkPage(doc, y, 30);
    y = sectionTitle(doc, y, "Top 5 Emoções");
    data.topEmotions.forEach((e, i) => {
      y = checkPage(doc, y, 6);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}. ${e.name} (${e.count})`, 18, y);
      y += 5;
    });
    y += 4;
  }

  // Top mentions
  if (data.topMentions.length > 0) {
    y = checkPage(doc, y, 30);
    y = sectionTitle(doc, y, "Menções Mais Relevantes");
    data.topMentions.forEach((m, i) => {
      y = checkPage(doc, y, 16);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. [${m.source}] ${m.author_name || m.author_handle || "Anônimo"}`, 18, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(m.content, pageWidth - 40);
      lines.slice(0, 3).forEach((line: string) => {
        y = checkPage(doc, y, 5);
        doc.text(line, 22, y);
        y += 4;
      });
      y += 2;
    });
  }

  doc.save(`relatorio-semanal-sentimento-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

// ── 2. Comparison Report ──
export function generateComparisonReport(data: ComparisonReportData) {
  const { doc, pageWidth } = createDoc();
  let y = addHeader(doc, pageWidth, "Comparativo com Adversários", "Últimos 30 dias");

  const colX = [14, 60, 90, 115, 140, 165];
  doc.setFillColor(...PRIMARY);
  doc.rect(14, y - 4, pageWidth - 28, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Entidade", colX[0] + 2, y);
  doc.text("Menções", colX[1] + 2, y);
  doc.text("% Positivo", colX[2] + 2, y);
  doc.text("% Negativo", colX[3] + 2, y);
  doc.text("% Neutro", colX[4] + 2, y);
  doc.text("Score", colX[5] + 2, y);
  doc.setTextColor(0, 0, 0);
  y += 5;

  data.entities.forEach((e, i) => {
    y = checkPage(doc, y, 7);
    if (i % 2 === 0) { doc.setFillColor(...LIGHT_BG); doc.rect(14, y - 4, pageWidth - 28, 6, "F"); }
    doc.setFontSize(8);
    doc.setFont("helvetica", i === 0 ? "bold" : "normal");
    const name = e.name.length > 22 ? e.name.substring(0, 20) + "..." : e.name;
    doc.text(name, colX[0] + 2, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(e.total), colX[1] + 2, y);
    doc.text(`${e.positivePct}%`, colX[2] + 2, y);
    doc.text(`${e.negativePct}%`, colX[3] + 2, y);
    doc.text(`${e.neutralPct}%`, colX[4] + 2, y);
    doc.text(e.avgScore.toFixed(2), colX[5] + 2, y);
    y += 6;
  });

  doc.save(`relatorio-comparativo-adversarios-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

// ── 3. Event Analysis Report ──
export function generateEventReport(data: EventReportData) {
  const { doc, pageWidth } = createDoc();
  let y = addHeader(doc, pageWidth, "Análise de Evento", data.entityName);

  y = sectionTitle(doc, y, data.event.titulo);
  y = addMetricRow(doc, y, "Data:", format(new Date(data.event.data_evento + "T12:00:00"), "dd/MM/yyyy"));
  y = addMetricRow(doc, y, "Tipo:", data.event.tipo || "—");
  y = addMetricRow(doc, y, "Impacto:", data.event.impacto_score ? `${data.event.impacto_score}/10` : "—");
  if (data.event.tags?.length) y = addMetricRow(doc, y, "Tags:", data.event.tags.join(", "));
  y += 4;

  y = sectionTitle(doc, y, "Impacto nas Menções");
  y = addMetricRow(doc, y, "Menções antes (7d):", String(data.mentionsBefore));
  y = addMetricRow(doc, y, "Menções depois (7d):", String(data.mentionsAfter));
  const variation = data.mentionsBefore > 0 ? Math.round(((data.mentionsAfter - data.mentionsBefore) / data.mentionsBefore) * 100) : 0;
  y = addMetricRow(doc, y, "Variação:", `${variation > 0 ? "+" : ""}${variation}%`);
  y += 4;

  y = sectionTitle(doc, y, "Sentimento Antes vs Depois");
  y = addMetricRow(doc, y, "Score médio antes:", data.sentimentBefore.toFixed(2));
  y = addMetricRow(doc, y, "Score médio depois:", data.sentimentAfter.toFixed(2));
  y += 4;

  if (data.event.ai_analysis) {
    y = checkPage(doc, y, 30);
    y = sectionTitle(doc, y, "Análise IA");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.event.ai_analysis, pageWidth - 28);
    lines.forEach((line: string) => {
      y = checkPage(doc, y, 5);
      doc.text(line, 14, y);
      y += 4;
    });
  }

  doc.save(`relatorio-evento-${data.event.titulo.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

// ── 5. Executive Summary ──
export function generateExecutiveReport(data: ExecutiveReportData) {
  const { doc, pageWidth } = createDoc();
  let y = addHeader(doc, pageWidth, "Resumo Executivo", `${data.entityName} — Últimos 7 dias`);

  y = sectionTitle(doc, y, "Métricas-Chave");
  y = addMetricRow(doc, y, "Total de Menções:", String(data.total));
  y = addMetricRow(doc, y, "Sentimento Positivo:", `${data.total ? Math.round((data.positive / data.total) * 100) : 0}%`);
  y = addMetricRow(doc, y, "Sentimento Negativo:", `${data.total ? Math.round((data.negative / data.total) * 100) : 0}%`);
  y = addMetricRow(doc, y, "Score Médio:", data.avgScore.toFixed(2));
  y = addMetricRow(doc, y, "Tendência:", data.trend);
  y += 4;

  if (data.topTopics.length > 0) {
    y = sectionTitle(doc, y, "Principais Tópicos");
    data.topTopics.forEach((t, i) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}. ${t.name} (${t.count})`, 18, y);
      y += 5;
    });
    y += 4;
  }

  if (data.topCategories.length > 0) {
    y = sectionTitle(doc, y, "Categorias de Menções");
    data.topCategories.forEach((c, i) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}. ${c.name} (${c.count})`, 18, y);
      y += 5;
    });
  }

  doc.save(`resumo-executivo-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
