/**
 * Demo Dashboard Data
 * Fictitious data shown only for demo-mode users
 */

import type { TopLeader } from "@/hooks/dashboard/useTopLeaders";
import type { CityRanking } from "@/hooks/dashboard/useCitiesRanking";
import type { TemaRanking } from "@/hooks/dashboard/useTemasRanking";

// ── Dashboard Stats ──
export const DEMO_DASHBOARD_STATS = {
  totalRegistrations: 4_327,
  citiesReached: 28,
  activeLeaders: 85,
  topCity: "Ceilândia",
  topCityCount: 612,
  lastRegistration: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
};

// ── Top 5 Leaders ──
export const DEMO_TOP_LEADERS: TopLeader[] = [
  { id: "demo-l1", name: "Marcos Vinícius de Almeida", phone: "61998001234", points: 1420, indicacoes: 87, region: "Ceilândia", position: 1, active: true },
  { id: "demo-l2", name: "Patrícia Souza Lima", phone: "61997002345", points: 1185, indicacoes: 72, region: "Taguatinga", position: 2, active: true },
  { id: "demo-l3", name: "Carlos Eduardo Ferreira", phone: "61996003456", points: 980, indicacoes: 58, region: "Samambaia", position: 3, active: true },
  { id: "demo-l4", name: "Ana Beatriz Nascimento", phone: "61995004567", points: 845, indicacoes: 49, region: "Águas Claras", position: 4, active: true },
  { id: "demo-l5", name: "Rafael dos Santos Costa", phone: "61994005678", points: 720, indicacoes: 41, region: "Plano Piloto", position: 5, active: true },
];

// ── Profile Stats ──
export const DEMO_PROFILE_STATS = {
  genero: [
    { label: "Feminino", valor: 54 },
    { label: "Masculino", valor: 42 },
    { label: "Não identificado", valor: 4 },
  ],
  idade_media: 36,
  participacao_eventos_pct: 41,
};

// ── Cities Ranking ──
export const DEMO_CITIES_RANKING: CityRanking[] = [
  { name: "Ceilândia", value: 612 },
  { name: "Taguatinga", value: 487 },
  { name: "Samambaia", value: 398 },
  { name: "Águas Claras", value: 354 },
  { name: "Plano Piloto", value: 321 },
  { name: "Gama", value: 278 },
  { name: "Sobradinho", value: 245 },
  { name: "Planaltina", value: 218 },
  { name: "Recanto das Emas", value: 195 },
  { name: "Santa Maria", value: 172 },
];

// ── Temas Ranking ──
export const DEMO_TEMAS_RANKING: TemaRanking[] = [
  { tema: "Saúde", cadastros: 842 },
  { tema: "Educação", cadastros: 715 },
  { tema: "Segurança", cadastros: 623 },
  { tema: "Transporte", cadastros: 498 },
  { tema: "Habitação", cadastros: 387 },
  { tema: "Meio Ambiente", cadastros: 312 },
  { tema: "Cultura e Lazer", cadastros: 265 },
  { tema: "Assistência Social", cadastros: 214 },
];

// ── Office Stats ──
export const DEMO_OFFICE_STATS = {
  totalVisits: 342,
  pendingVisits: 8,
  meetingsCompleted: 287,
  checkedIn: 12,
  acceptRateReuniao: 73,
  recentVisits: [
    { id: "demo-v1", contactName: "Fernanda Oliveira", status: "CHECKED_IN", createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: "demo-v2", contactName: "Lucas Pereira", status: "FORM_SUBMITTED", createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: "demo-v3", contactName: "Juliana Martins", status: "LINK_SENT", createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  ],
};
