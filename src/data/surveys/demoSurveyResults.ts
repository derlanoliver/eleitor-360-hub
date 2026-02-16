/**
 * Demo Survey Results Data
 * Fictitious questions and responses for demo-mode survey results
 */
import type { SurveyQuestion } from "@/hooks/surveys/useSurveys";

// ─── Questions per survey ─────────────────────────────────────
export const DEMO_SURVEY_QUESTIONS: Record<string, SurveyQuestion[]> = {
  "demo-survey-1": [
    { id: "q1-1", survey_id: "demo-survey-1", ordem: 1, tipo: "multipla_escolha", pergunta: "Qual serviço público mais utilizado por você?", opcoes: ["Saúde", "Educação", "Transporte", "Segurança", "Assistência Social"], obrigatoria: true, config: {}, created_at: "2025-11-01T10:00:00Z" },
    { id: "q1-2", survey_id: "demo-survey-1", ordem: 2, tipo: "escala", pergunta: "Como você avalia a qualidade geral dos serviços públicos na sua região?", opcoes: null, obrigatoria: true, config: {}, created_at: "2025-11-01T10:00:00Z" },
    { id: "q1-3", survey_id: "demo-survey-1", ordem: 3, tipo: "nps", pergunta: "De 0 a 10, qual a probabilidade de recomendar os serviços públicos da região a um amigo?", opcoes: null, obrigatoria: true, config: {}, created_at: "2025-11-01T10:00:00Z" },
    { id: "q1-4", survey_id: "demo-survey-1", ordem: 4, tipo: "sim_nao", pergunta: "Você já participou de alguma audiência pública na sua região?", opcoes: null, obrigatoria: true, config: {}, created_at: "2025-11-01T10:00:00Z" },
    { id: "q1-5", survey_id: "demo-survey-1", ordem: 5, tipo: "texto_curto", pergunta: "Qual a principal melhoria que você gostaria de ver na sua comunidade?", opcoes: null, obrigatoria: false, config: {}, created_at: "2025-11-01T10:00:00Z" },
  ],
  "demo-survey-2": [
    { id: "q2-1", survey_id: "demo-survey-2", ordem: 1, tipo: "multipla_escolha", pergunta: "Qual área deve ter prioridade no orçamento?", opcoes: ["Saúde", "Educação", "Infraestrutura", "Segurança"], obrigatoria: true, config: {}, created_at: "2026-01-10T08:00:00Z" },
    { id: "q2-2", survey_id: "demo-survey-2", ordem: 2, tipo: "escala", pergunta: "Qual o nível de importância do transporte público para você?", opcoes: null, obrigatoria: true, config: {}, created_at: "2026-01-10T08:00:00Z" },
    { id: "q2-3", survey_id: "demo-survey-2", ordem: 3, tipo: "sim_nao", pergunta: "Você acha que o orçamento participativo funciona?", opcoes: null, obrigatoria: true, config: {}, created_at: "2026-01-10T08:00:00Z" },
    { id: "q2-4", survey_id: "demo-survey-2", ordem: 4, tipo: "texto_longo", pergunta: "Deixe sua sugestão para o orçamento participativo:", opcoes: null, obrigatoria: false, config: {}, created_at: "2026-01-10T08:00:00Z" },
  ],
  "demo-survey-3": [
    { id: "q3-1", survey_id: "demo-survey-3", ordem: 1, tipo: "nps", pergunta: "De 0 a 10, como você avalia os eventos comunitários realizados?", opcoes: null, obrigatoria: true, config: {}, created_at: "2025-09-01T09:00:00Z" },
    { id: "q3-2", survey_id: "demo-survey-3", ordem: 2, tipo: "multipla_escolha", pergunta: "Qual tipo de evento você mais gostou?", opcoes: ["Cultural", "Esportivo", "Educacional", "Saúde", "Lazer"], obrigatoria: true, config: {}, created_at: "2025-09-01T09:00:00Z" },
    { id: "q3-3", survey_id: "demo-survey-3", ordem: 3, tipo: "sim_nao", pergunta: "Você participaria novamente desses eventos?", opcoes: null, obrigatoria: true, config: {}, created_at: "2025-09-01T09:00:00Z" },
    { id: "q3-4", survey_id: "demo-survey-3", ordem: 4, tipo: "texto_curto", pergunta: "O que mais gostou nos eventos?", opcoes: null, obrigatoria: false, config: {}, created_at: "2025-09-01T09:00:00Z" },
  ],
  "demo-survey-4": [
    { id: "q4-1", survey_id: "demo-survey-4", ordem: 1, tipo: "escala", pergunta: "Qual seu nível de sensação de segurança na sua região?", opcoes: null, obrigatoria: true, config: {}, created_at: "2026-01-15T11:00:00Z" },
    { id: "q4-2", survey_id: "demo-survey-4", ordem: 2, tipo: "multipla_escolha", pergunta: "Qual o principal problema de segurança na sua região?", opcoes: ["Furtos", "Iluminação precária", "Tráfico", "Falta de policiamento"], obrigatoria: true, config: {}, created_at: "2026-01-15T11:00:00Z" },
    { id: "q4-3", survey_id: "demo-survey-4", ordem: 3, tipo: "sim_nao", pergunta: "Você já foi vítima de algum crime na região?", opcoes: null, obrigatoria: true, config: {}, created_at: "2026-01-15T11:00:00Z" },
    { id: "q4-4", survey_id: "demo-survey-4", ordem: 4, tipo: "nps", pergunta: "De 0 a 10, como avalia a atuação policial na sua região?", opcoes: null, obrigatoria: true, config: {}, created_at: "2026-01-15T11:00:00Z" },
  ],
  "demo-survey-6": [
    { id: "q6-1", survey_id: "demo-survey-6", ordem: 1, tipo: "multipla_escolha", pergunta: "Qual serviço de saúde você mais utiliza?", opcoes: ["UBS", "Hospital Regional", "SAMU", "Farmácia Popular"], obrigatoria: true, config: {}, created_at: "2025-06-01T10:00:00Z" },
    { id: "q6-2", survey_id: "demo-survey-6", ordem: 2, tipo: "nps", pergunta: "De 0 a 10, como você avalia o atendimento de saúde?", opcoes: null, obrigatoria: true, config: {}, created_at: "2025-06-01T10:00:00Z" },
    { id: "q6-3", survey_id: "demo-survey-6", ordem: 3, tipo: "sim_nao", pergunta: "Você consegue marcar consultas com facilidade?", opcoes: null, obrigatoria: true, config: {}, created_at: "2025-06-01T10:00:00Z" },
  ],
};

// ─── Helper to generate responses ─────────────────────────────
const leaderNames = [
  "Carlos Silva", "Maria Oliveira", "João Santos", "Ana Costa", "Pedro Souza",
  "Fernanda Lima", "Roberto Almeida", "Juliana Pereira", "Lucas Ferreira", "Patrícia Gomes",
  "André Ribeiro", "Camila Martins", "Rodrigo Araújo", "Beatriz Cardoso", "Marcos Vieira",
];

const contactNames = [
  "José Nascimento", "Mariana Barros", "Felipe Ramos", "Clara Nunes", "Gustavo Teixeira",
  "Larissa Dias", "Rafael Moreira", "Isabela Castro", "Bruno Correia", "Natália Rocha",
  "Diego Barbosa", "Amanda Mendes", "Thiago Pinto", "Carolina Monteiro", "Eduardo Lopes",
  "Vanessa Carvalho", "Renato Freitas", "Aline Duarte", "Henrique Melo", "Priscila Andrade",
];

const textSuggestions = [
  "Mais postos de saúde no bairro",
  "Melhorar a iluminação pública nas vias principais",
  "Ampliar horários de ônibus nos fins de semana",
  "Criar áreas de lazer para crianças e idosos",
  "Reformar as escolas públicas da região",
  "Aumentar o policiamento ostensivo à noite",
  "Construir ciclovias e calçadas acessíveis",
  "Melhorar o saneamento básico nas comunidades",
  "Oferecer cursos profissionalizantes gratuitos",
  "Criar programas de esporte para jovens",
  "Mais opções de transporte público",
  "Resolver o problema das enchentes",
];

const longTextSuggestions = [
  "Acredito que o orçamento deveria priorizar a melhoria do transporte público, pois afeta diretamente a qualidade de vida de milhares de trabalhadores.",
  "Sugiro investir mais em educação e capacitação profissional para jovens da periferia, criando oportunidades reais de emprego.",
  "A infraestrutura das ruas precisa de atenção urgente. Muitas vias estão esburacadas e sem sinalização adequada.",
  "Precisamos de mais creches públicas. Muitas mães não conseguem trabalhar por falta de onde deixar os filhos.",
  "O orçamento deveria contemplar a construção de uma UPA 24h na nossa região, pois o hospital mais próximo fica a 40 minutos.",
];

const eventFeedback = [
  "A organização foi excelente e as atividades para crianças",
  "Gostei muito da feira de artesanato e da praça de alimentação",
  "O show cultural foi incrível, parabéns pela iniciativa",
  "A palestra sobre saúde preventiva foi muito informativa",
  "Adorei o campeonato de futebol comunitário",
  "A distribuição de mudas foi uma ótima ideia",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDate(base: string, rangeInDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + Math.floor(Math.random() * rangeInDays));
  d.setHours(Math.floor(Math.random() * 14) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

function generateResponsesForSurvey(
  surveyId: string,
  questions: SurveyQuestion[],
  count: number,
  startDate: string,
  daysRange: number
): any[] {
  const responses: any[] = [];

  for (let i = 0; i < count; i++) {
    const isLeader = i < Math.floor(count * 0.15); // 15% leaders
    const hasReferrer = !isLeader && i < Math.floor(count * 0.35); // 20% referred
    const leaderIdx = i % leaderNames.length;
    const contactIdx = i % contactNames.length;

    const respostas: Record<string, any> = {};
    for (const q of questions) {
      switch (q.tipo) {
        case "multipla_escolha":
          respostas[q.id] = pickRandom(q.opcoes!);
          break;
        case "escala":
          respostas[q.id] = Math.floor(Math.random() * 5) + 1;
          break;
        case "nps":
          // Skew toward higher scores
          respostas[q.id] = Math.min(10, Math.max(0, Math.floor(Math.random() * 11 * 0.7 + 3)));
          break;
        case "sim_nao":
          respostas[q.id] = Math.random() > 0.4;
          break;
        case "texto_curto":
          respostas[q.id] = i % 3 === 0 ? pickRandom(textSuggestions) : pickRandom(eventFeedback);
          break;
        case "texto_longo":
          respostas[q.id] = pickRandom(longTextSuggestions);
          break;
      }
    }

    responses.push({
      id: `demo-resp-${surveyId}-${i}`,
      survey_id: surveyId,
      contact_id: !isLeader ? `demo-contact-${contactIdx}` : null,
      leader_id: isLeader ? `demo-leader-${leaderIdx}` : null,
      referred_by_leader_id: hasReferrer ? `demo-leader-${(leaderIdx + 3) % leaderNames.length}` : null,
      respostas,
      is_leader: isLeader,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      created_at: generateDate(startDate, daysRange),
      // Joined data for table display
      contact: !isLeader ? {
        id: `demo-contact-${contactIdx}`,
        nome: contactNames[contactIdx],
        telefone_norm: `5561999${String(900 + contactIdx).padStart(3, "0")}${String(1000 + i).slice(-4)}`,
        email: null,
      } : null,
      leader: isLeader ? {
        id: `demo-leader-${leaderIdx}`,
        nome_completo: leaderNames[leaderIdx],
      } : null,
      referred_by: hasReferrer ? {
        id: `demo-leader-${(leaderIdx + 3) % leaderNames.length}`,
        nome_completo: leaderNames[(leaderIdx + 3) % leaderNames.length],
      } : null,
    });
  }

  return responses;
}

// ─── Pre-generated responses (seeded once) ────────────────────
const _cache: Record<string, any[]> = {};

export function getDemoSurveyResponses(surveyId: string): any[] {
  if (_cache[surveyId]) return _cache[surveyId];

  const questions = DEMO_SURVEY_QUESTIONS[surveyId];
  if (!questions) return [];

  const countMap: Record<string, { count: number; start: string; days: number }> = {
    "demo-survey-1": { count: 120, start: "2025-11-05", days: 90 },
    "demo-survey-2": { count: 85, start: "2026-01-12", days: 30 },
    "demo-survey-3": { count: 200, start: "2025-09-05", days: 100 },
    "demo-survey-4": { count: 55, start: "2026-01-18", days: 25 },
    "demo-survey-6": { count: 150, start: "2025-06-05", days: 100 },
  };

  const cfg = countMap[surveyId];
  if (!cfg) return [];

  const result = generateResponsesForSurvey(surveyId, questions, cfg.count, cfg.start, cfg.days);
  _cache[surveyId] = result;
  return result;
}
