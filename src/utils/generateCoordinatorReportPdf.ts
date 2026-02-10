import jsPDF from "jspdf";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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

function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-8);
}

async function fetchAllRegistrations(eventId: string) {
  const results: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        id, nome, email, whatsapp, checked_in, checked_in_at, created_at,
        cidade_id, leader_id,
        office_cities ( id, nome )
      `)
      .eq('event_id', eventId)
      .range(from, from + batchSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return results;
}

async function fetchAllLeaders() {
  const results: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('lideres')
      .select('id, email, telefone, is_coordinator, parent_leader_id, nome_completo')
      .range(from, from + batchSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return results;
}

export async function generateCoordinatorReportPdf() {
  // Fetch all events ordered by date desc
  const { data: allEvents, error: evError } = await supabase
    .from('events')
    .select('id, name, date')
    .order('date', { ascending: false });

  if (evError) throw evError;
  if (!allEvents || allEvents.length === 0) {
    throw new Error('Nenhum evento encontrado');
  }

  // Fetch all leaders once
  const leaders = await fetchAllLeaders();

  const leadersByEmail = new Map<string, { id: string; is_coordinator: boolean; parent_leader_id: string | null; nome_completo: string }>();
  const leadersByPhone = new Map<string, { id: string; is_coordinator: boolean; parent_leader_id: string | null; nome_completo: string }>();
  const leadersById = new Map<string, { nome_completo: string; is_coordinator: boolean; parent_leader_id: string | null }>();

  leaders.forEach((l: any) => {
    leadersById.set(l.id, {
      nome_completo: l.nome_completo,
      is_coordinator: l.is_coordinator || false,
      parent_leader_id: l.parent_leader_id
    });
    if (l.email) {
      leadersByEmail.set(l.email.toLowerCase(), { id: l.id, is_coordinator: l.is_coordinator || false, parent_leader_id: l.parent_leader_id, nome_completo: l.nome_completo });
    }
    if (l.telefone) {
      const normalized = normalizePhone(l.telefone);
      if (normalized.length >= 8) {
        leadersByPhone.set(normalized, { id: l.id, is_coordinator: l.is_coordinator || false, parent_leader_id: l.parent_leader_id, nome_completo: l.nome_completo });
      }
    }
  });

  // Resolve the top coordinator name for a leader
  function resolveCoordinatorName(leaderId: string | null): string | null {
    if (!leaderId) return null;
    const leader = leadersById.get(leaderId);
    if (!leader) return null;
    if (leader.is_coordinator) return leader.nome_completo;
    if (leader.parent_leader_id) return resolveCoordinatorName(leader.parent_leader_id);
    return null;
  }

  // Build event blocks
  const events: EventBlock[] = [];

  for (const event of allEvents) {
    const registrations = await fetchAllRegistrations(event.id);
    if (registrations.length === 0) continue;

    const totalInscritos = registrations.length;
    const totalCheckins = registrations.filter((r: any) => r.checked_in).length;

    // Group by coordinator
    const coordGroups = new Map<string, { tipo: string; inscritos: number; checkins: number; isCoordinator: boolean }>();

    registrations.forEach((reg: any) => {
      const emailLower = reg.email?.toLowerCase() || '';
      const phoneNormalized = normalizePhone(reg.whatsapp);

      const emailMatch = leadersByEmail.get(emailLower);
      const phoneMatch = leadersByPhone.get(phoneNormalized);
      const match = emailMatch || phoneMatch;

      let coordName = 'Sem coordenador';
      let tipo = '—';
      let isCoord = false;

      if (match) {
        if (match.is_coordinator) {
          // This person IS a coordinator
          coordName = match.nome_completo;
          tipo = 'Coordenador presente';
          isCoord = true;
        } else {
          // This person is a leader, find their coordinator
          const parentCoordName = resolveCoordinatorName(match.parent_leader_id);
          if (parentCoordName) {
            coordName = parentCoordName;
            tipo = 'Líderes';
          } else {
            coordName = 'Sem coordenador';
            tipo = '—';
          }
        }
      } else if (reg.leader_id) {
        // Registration has a leader_id, try to resolve coordinator
        const regLeader = leadersById.get(reg.leader_id);
        if (regLeader) {
          if (regLeader.is_coordinator) {
            coordName = regLeader.nome_completo;
            tipo = 'Líderes';
          } else {
            const parentCoordName = resolveCoordinatorName(regLeader.parent_leader_id);
            if (parentCoordName) {
              coordName = parentCoordName;
              tipo = 'Líderes';
            }
          }
        }
      }

      const existing = coordGroups.get(coordName);
      if (existing) {
        existing.inscritos++;
        if (reg.checked_in) existing.checkins++;
        // If the coordinator themselves showed up, update tipo
        if (isCoord && existing.tipo === 'Líderes') {
          existing.tipo = 'Coordenador + Líderes';
          existing.isCoordinator = true;
        } else if (!isCoord && existing.isCoordinator && existing.tipo === 'Coordenador presente') {
          existing.tipo = 'Coordenador + Líderes';
        }
      } else {
        coordGroups.set(coordName, {
          tipo,
          inscritos: 1,
          checkins: reg.checked_in ? 1 : 0,
          isCoordinator: isCoord
        });
      }
    });

    // Sort: coordinators first (by inscritos desc), then leaders (by inscritos desc), then "Sem coordenador" last
    const rows = Array.from(coordGroups.entries())
      .map(([coordinator, data]) => ({ coordinator, tipo: data.tipo, inscritos: data.inscritos, checkins: data.checkins, isCoordinator: data.isCoordinator }))
      .sort((a, b) => {
        if (a.coordinator === 'Sem coordenador') return 1;
        if (b.coordinator === 'Sem coordenador') return -1;
        if (a.isCoordinator && !b.isCoordinator) return -1;
        if (!a.isCoordinator && b.isCoordinator) return 1;
        return b.inscritos - a.inscritos;
      })
      .map(({ coordinator, tipo, inscritos, checkins }) => ({ coordinator, tipo, inscritos, checkins }));

    const eventDate = event.date ? format(new Date(event.date + 'T12:00:00'), 'dd/MM/yyyy') : '—';

    events.push({
      eventName: event.name,
      date: eventDate,
      totalInscritos,
      totalCheckins,
      rows
    });
  }

  if (events.length === 0) {
    throw new Error('Nenhum evento com inscrições encontrado');
  }

  // ---- PDF Generation ----
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

  const colX = [14, 82, 122, 142, 160, 178];

  const drawTableHeader = () => {
    doc.setFillColor(240, 80, 35);
    doc.rect(14, y - 4, pageWidth - 28, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Coordenador", colX[0] + 2, y);
    doc.text("Tipo", colX[1] + 2, y);
    doc.text("Inscr.", colX[2] + 2, y);
    doc.text("Check", colX[3] + 2, y);
    doc.text("% Inscr.", colX[4] + 1, y);
    doc.text("% Check", colX[5] + 1, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  };

  events.forEach((event, idx) => {
    checkPage(40);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(240, 80, 35);
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
        doc.setFillColor(253, 241, 236);
        doc.rect(14, y - 4, pageWidth - 28, 6, "F");
      }

      doc.setFontSize(8);
      const isCoord = row.tipo.toLowerCase().includes("coordenador");
      doc.setFont("helvetica", isCoord ? "bold" : "normal");

      const name = row.coordinator.length > 30 ? row.coordinator.substring(0, 28) + "..." : row.coordinator;
      doc.text(name, colX[0] + 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(row.tipo, colX[1] + 2, y);
      doc.text(String(row.inscritos), colX[2] + 9, y, { align: "center" });
      doc.text(String(row.checkins), colX[3] + 8, y, { align: "center" });
      const pctInsc = event.totalInscritos > 0 ? ((row.inscritos / event.totalInscritos) * 100).toFixed(1) + "%" : "0%";
      doc.text(pctInsc, colX[4] + 8, y, { align: "center" });
      const pctCheck = event.totalCheckins > 0 ? ((row.checkins / event.totalCheckins) * 100).toFixed(1) + "%" : "0%";
      doc.text(pctCheck, colX[5] + 8, y, { align: "center" });
      y += 6;
    });

    const rate = event.totalInscritos > 0 ? ((event.totalCheckins / event.totalInscritos) * 100).toFixed(1) : "0";
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.text(`Taxa de conversao geral: ${rate}%`, 14, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 12;
  });

  const fileName = `relatorio-coordenadores-eventos-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
