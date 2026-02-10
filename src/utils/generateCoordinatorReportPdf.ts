import jsPDF from "jspdf";
import { format } from "date-fns";

interface CoordinatorEventRow {
  coordinator: string;
  tipo: string;
  inscritos: number;
  checkins: number;
}

interface EventBlock {
  eventName: string;
  date: string;
  totalInscritos: number;
  totalCheckins: number;
  rows: CoordinatorEventRow[];
}

export function generateCoordinatorReportPdf() {
  const doc = new jsPDF();
  let y = 15;

  const pageWidth = doc.internal.pageSize.getWidth();

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 15;
    }
  };

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Presença por Coordenador", pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  const events: EventBlock[] = [
    {
      eventName: "Encontro de Trabalho — Ceilândia Norte",
      date: "10/02/2026",
      totalInscritos: 50,
      totalCheckins: 29,
      rows: [
        { coordinator: "(HELENINHA) Helena Farias de Souza", tipo: "Líderes", inscritos: 26, checkins: 23 },
        { coordinator: "José Jeckson Moraes de Araújo Silva", tipo: "Coordenador presente", inscritos: 1, checkins: 1 },
        { coordinator: "Zilda Maria da Cunha", tipo: "Coordenadora presente", inscritos: 1, checkins: 1 },
        { coordinator: "Rafael Prudente", tipo: "Líderes", inscritos: 5, checkins: 2 },
        { coordinator: "TCB (Contratados)", tipo: "Líderes", inscritos: 1, checkins: 0 },
      ],
    },
    {
      eventName: "Encontro de Trabalho — P SUL Ceilândia",
      date: "02/02/2026",
      totalInscritos: 234,
      totalCheckins: 197,
      rows: [
        { coordinator: "(BOCA) Anderson Faedda", tipo: "Coordenador + Líderes", inscritos: 53, checkins: 42 },
        { coordinator: "Marcio Francisco da Silva", tipo: "Coordenador + Líderes", inscritos: 18, checkins: 17 },
        { coordinator: "Pr. Carlos Antonio Soares Campos", tipo: "Coordenador + Líderes", inscritos: 16, checkins: 13 },
        { coordinator: "José Jeckson Moraes de Araújo Silva", tipo: "Coordenador + Líderes", inscritos: 5, checkins: 4 },
        { coordinator: "Adevair Aparecido Silva", tipo: "Coordenador presente", inscritos: 1, checkins: 1 },
        { coordinator: "Zilda Maria da Cunha", tipo: "Coordenadora + Líderes", inscritos: 3, checkins: 3 },
        { coordinator: "Miriam Gonçalves Pereira", tipo: "Coordenadora + Líderes", inscritos: 2, checkins: 0 },
        { coordinator: "Rafael Prudente", tipo: "Líderes", inscritos: 32, checkins: 30 },
        { coordinator: "COMISSIONADOS", tipo: "Líderes", inscritos: 8, checkins: 5 },
        { coordinator: "Milton Alves Baraúna", tipo: "Líderes", inscritos: 4, checkins: 4 },
        { coordinator: "Almino Ramão Nogueira", tipo: "Líderes", inscritos: 1, checkins: 1 },
        { coordinator: "(KAL) Luiz Carlos de Sousa", tipo: "Líderes", inscritos: 1, checkins: 1 },
        { coordinator: "(HELENINHA) Helena Farias de Souza", tipo: "Líderes", inscritos: 1, checkins: 0 },
        { coordinator: "Rita de Paula Guedes", tipo: "Líderes", inscritos: 1, checkins: 0 },
        { coordinator: "Vanderlei Rodrigues de Oliveira", tipo: "Líderes", inscritos: 1, checkins: 0 },
      ],
    },
    {
      eventName: "Reunião Itapoã",
      date: "01/02/2026",
      totalInscritos: 93,
      totalCheckins: 79,
      rows: [
        { coordinator: "CRISTIANO MACHADO DA SILVA", tipo: "Líderes", inscritos: 67, checkins: 60 },
        { coordinator: "Raimundo Paz", tipo: "Coordenador + Líderes", inscritos: 12, checkins: 9 },
        { coordinator: "Almino Ramão Nogueira", tipo: "Coordenador presente", inscritos: 1, checkins: 1 },
        { coordinator: "Miriam Gonçalves Pereira", tipo: "Coordenadora presente", inscritos: 1, checkins: 0 },
        { coordinator: "(Lincon) Francisco Alfredo do Nascimento", tipo: "Líderes", inscritos: 4, checkins: 4 },
        { coordinator: "COMISSIONADOS", tipo: "Líderes", inscritos: 3, checkins: 2 },
        { coordinator: "Vanderlei Rodrigues de Oliveira", tipo: "Líderes", inscritos: 3, checkins: 3 },
        { coordinator: "Rafael Prudente", tipo: "Líderes", inscritos: 2, checkins: 1 },
        { coordinator: "Luana Nascimento Coimbra", tipo: "Líderes", inscritos: 1, checkins: 1 },
        { coordinator: "Rita de Paula Guedes", tipo: "Líderes", inscritos: 1, checkins: 1 },
      ],
    },
  ];

  // Table drawing helper
  const colX = [14, 100, 145, 170];
  const colW = [84, 43, 23, 23];

  const drawTableHeader = () => {
    doc.setFillColor(41, 65, 122);
    doc.rect(14, y - 4, pageWidth - 28, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Coordenador", colX[0] + 2, y);
    doc.text("Tipo", colX[1] + 2, y);
    doc.text("Inscritos", colX[2] + 2, y);
    doc.text("Check-ins", colX[3] + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  };

  events.forEach((event, idx) => {
    checkPage(40);

    // Event header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 65, 122);
    doc.text(`${idx + 1}. ${event.eventName}`, 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Data: ${event.date}  |  Total: ${event.totalInscritos} inscritos  |  ${event.totalCheckins} check-ins`, 14, y);
    y += 8;

    doc.setTextColor(0, 0, 0);

    drawTableHeader();

    event.rows.forEach((row, rIdx) => {
      checkPage(8);

      if (rIdx % 2 === 0) {
        doc.setFillColor(240, 243, 250);
        doc.rect(14, y - 4, pageWidth - 28, 6, "F");
      }

      doc.setFontSize(8);
      const isCoord = row.tipo.toLowerCase().includes("coordenador");
      doc.setFont("helvetica", isCoord ? "bold" : "normal");

      // Truncate long names
      const name = row.coordinator.length > 38 ? row.coordinator.substring(0, 36) + "..." : row.coordinator;
      doc.text(name, colX[0] + 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(row.tipo, colX[1] + 2, y);
      doc.text(String(row.inscritos), colX[2] + 10, y, { align: "center" });
      doc.text(String(row.checkins), colX[3] + 10, y, { align: "center" });
      y += 6;
    });

    // Conversion rate
    const rate = event.totalInscritos > 0 ? ((event.totalCheckins / event.totalInscritos) * 100).toFixed(1) : "0";
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.text(`Taxa de conversão geral: ${rate}%`, 14, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 12;
  });

  // Summary footer
  checkPage(30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(41, 65, 122);
  doc.text("Resumo dos Coordenadores Presentes", 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const summaryLines = [
    "✅ Presentes com check-in: Boca, Adevair, José Jeckson, Zilda, Marcio, Pr. Carlos, Almino, Raimundo Paz",
    "❌ Sem check-in: Miriam Gonçalves (inscrita em P SUL e Itapoã sem check-in)",
    "⚠️ Não inscritos mas com líderes presentes: Heleninha (26 líderes em Ceil. Norte), Cristiano (67 em Itapoã)",
  ];

  summaryLines.forEach((line) => {
    checkPage(8);
    const splitLines = doc.splitTextToSize(line, pageWidth - 28);
    splitLines.forEach((sl: string) => {
      doc.text(sl, 14, y);
      y += 5;
    });
    y += 2;
  });

  const fileName = `relatorio-coordenadores-eventos-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
