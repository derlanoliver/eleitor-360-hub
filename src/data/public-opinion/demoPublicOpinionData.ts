// Mock data for the Public Opinion module

export const SENTIMENT_OVERVIEW = {
  total_mentions: 12847,
  positive_pct: 62,
  negative_pct: 18,
  neutral_pct: 20,
  sentiment_score: 7.4,
  trend: 'up' as const,
  trend_pct: 4.2,
  period: 'Últimos 30 dias',
  sources: {
    twitter: 4521,
    instagram: 3892,
    facebook: 2134,
    youtube: 987,
    tiktok: 654,
    portais: 659,
  },
  top_hashtags: [
    { tag: '#RafaelPrudente', count: 3421, sentiment: 0.72 },
    { tag: '#BrasíliaAvança', count: 1845, sentiment: 0.85 },
    { tag: '#CLDFativa', count: 1234, sentiment: 0.61 },
    { tag: '#SaúdeDF', count: 987, sentiment: 0.55 },
    { tag: '#SegurançaDF', count: 876, sentiment: -0.12 },
  ],
  engagement_rate: 4.8,
  reach_estimate: 2340000,
};

export const SENTIMENT_TIMELINE = [
  { date: '2026-01-01', positive: 58, negative: 22, neutral: 20, mentions: 342 },
  { date: '2026-01-08', positive: 61, negative: 19, neutral: 20, mentions: 398 },
  { date: '2026-01-15', positive: 55, negative: 25, neutral: 20, mentions: 521 },
  { date: '2026-01-22', positive: 63, negative: 17, neutral: 20, mentions: 445 },
  { date: '2026-01-29', positive: 67, negative: 15, neutral: 18, mentions: 389 },
  { date: '2026-02-05', positive: 60, negative: 20, neutral: 20, mentions: 467 },
  { date: '2026-02-12', positive: 64, negative: 16, neutral: 20, mentions: 512 },
  { date: '2026-02-18', positive: 62, negative: 18, neutral: 20, mentions: 398 },
];

export const COMPETITOR_DATA = [
  {
    id: '1',
    nome: 'Rafael Prudente',
    partido: 'MDB',
    foto_url: null,
    mentions: 12847,
    positive_pct: 62,
    negative_pct: 18,
    neutral_pct: 20,
    sentiment_score: 7.4,
    followers_total: 245000,
    engagement_rate: 4.8,
    top_topics: ['Saúde', 'Educação', 'Infraestrutura'],
    color: '#3b82f6',
  },
  {
    id: '2',
    nome: 'Adversário A',
    partido: 'PT',
    foto_url: null,
    mentions: 9234,
    positive_pct: 48,
    negative_pct: 32,
    neutral_pct: 20,
    sentiment_score: 5.2,
    followers_total: 189000,
    engagement_rate: 3.2,
    top_topics: ['Economia', 'Segurança', 'Emprego'],
    color: '#ef4444',
  },
  {
    id: '3',
    nome: 'Adversário B',
    partido: 'PL',
    foto_url: null,
    mentions: 7891,
    positive_pct: 51,
    negative_pct: 28,
    neutral_pct: 21,
    sentiment_score: 5.8,
    followers_total: 156000,
    engagement_rate: 2.9,
    top_topics: ['Segurança', 'Família', 'Economia'],
    color: '#f59e0b',
  },
];

export const DEMOGRAPHIC_DATA = {
  gender: [
    { label: 'Masculino', value: 58 },
    { label: 'Feminino', value: 38 },
    { label: 'Outro', value: 4 },
  ],
  age: [
    { label: '18-24', value: 12 },
    { label: '25-34', value: 28 },
    { label: '35-44', value: 25 },
    { label: '45-54', value: 20 },
    { label: '55-64', value: 10 },
    { label: '65+', value: 5 },
  ],
  regions: [
    { label: 'Plano Piloto', value: 18, sentiment: 0.72 },
    { label: 'Ceilândia', value: 14, sentiment: 0.58 },
    { label: 'Taguatinga', value: 12, sentiment: 0.65 },
    { label: 'Samambaia', value: 9, sentiment: 0.61 },
    { label: 'Águas Claras', value: 8, sentiment: 0.78 },
    { label: 'Gama', value: 7, sentiment: 0.52 },
    { label: 'Sobradinho', value: 6, sentiment: 0.69 },
    { label: 'Outros', value: 26, sentiment: 0.60 },
  ],
  topics_interest: [
    { label: 'Saúde Pública', value: 32 },
    { label: 'Educação', value: 24 },
    { label: 'Infraestrutura', value: 18 },
    { label: 'Segurança', value: 14 },
    { label: 'Meio Ambiente', value: 7 },
    { label: 'Emprego', value: 5 },
  ],
};

export interface PublicComment {
  id: string;
  author: string;
  avatar_url: string | null;
  source: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'portal';
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'elogio' | 'reclamação' | 'dúvida' | 'sugestão' | 'comparação';
  likes: number;
  shares: number;
  date: string;
  url: string;
  location?: string;
}

export const COMMENTS_DATA: PublicComment[] = [
  {
    id: '1', author: 'Maria Silva', avatar_url: null, source: 'twitter',
    content: 'Excelente trabalho do @RafaelPrudente na inauguração do novo hospital em Ceilândia. A saúde pública precisa de mais ações assim!',
    sentiment: 'positive', category: 'elogio', likes: 342, shares: 89, date: '2026-02-18T10:30:00Z', url: '#', location: 'Ceilândia',
  },
  {
    id: '2', author: 'João Santos', avatar_url: null, source: 'instagram',
    content: 'Cadê a iluminação que prometeram pro Gama? Já fazem 6 meses e nada mudou.',
    sentiment: 'negative', category: 'reclamação', likes: 156, shares: 23, date: '2026-02-17T15:45:00Z', url: '#', location: 'Gama',
  },
  {
    id: '3', author: 'Ana Oliveira', avatar_url: null, source: 'facebook',
    content: 'A reforma da escola em Taguatinga ficou muito boa! Meus filhos estão adorando.',
    sentiment: 'positive', category: 'elogio', likes: 234, shares: 45, date: '2026-02-17T09:15:00Z', url: '#', location: 'Taguatinga',
  },
  {
    id: '4', author: 'Carlos Mendes', avatar_url: null, source: 'twitter',
    content: 'Alguém sabe quando vão entregar as obras do metrô em Samambaia? @RafaelPrudente pode responder?',
    sentiment: 'neutral', category: 'dúvida', likes: 78, shares: 12, date: '2026-02-16T18:20:00Z', url: '#', location: 'Samambaia',
  },
  {
    id: '5', author: 'Portal G1 DF', avatar_url: null, source: 'portal',
    content: 'Rafael Prudente anuncia investimento de R$ 50 milhões em infraestrutura para regiões administrativas do DF.',
    sentiment: 'neutral', category: 'sugestão', likes: 1200, shares: 345, date: '2026-02-16T08:00:00Z', url: '#',
  },
  {
    id: '6', author: 'Pedro Lima', avatar_url: null, source: 'youtube',
    content: 'Comparando o trabalho do Prudente com o adversário A, claramente Prudente tem entregado mais na área de saúde.',
    sentiment: 'positive', category: 'comparação', likes: 567, shares: 123, date: '2026-02-15T14:30:00Z', url: '#',
  },
  {
    id: '7', author: 'Fernanda Costa', avatar_url: null, source: 'tiktok',
    content: 'Esse político prometeu e cumpriu! Novo centro de saúde em Águas Claras inaugurado hoje 🏥',
    sentiment: 'positive', category: 'elogio', likes: 4521, shares: 890, date: '2026-02-15T11:00:00Z', url: '#', location: 'Águas Claras',
  },
  {
    id: '8', author: 'Ricardo Alves', avatar_url: null, source: 'twitter',
    content: 'A segurança em Sobradinho continua péssima. Precisamos de mais ação e menos discurso.',
    sentiment: 'negative', category: 'reclamação', likes: 234, shares: 56, date: '2026-02-14T20:10:00Z', url: '#', location: 'Sobradinho',
  },
  {
    id: '9', author: 'Luciana Martins', avatar_url: null, source: 'instagram',
    content: 'Sugiro que o @RafaelPrudente visite as escolas rurais do DF. Precisam de atenção urgente!',
    sentiment: 'neutral', category: 'sugestão', likes: 189, shares: 34, date: '2026-02-14T16:45:00Z', url: '#',
  },
  {
    id: '10', author: 'Jornal de Brasília', avatar_url: null, source: 'portal',
    content: 'Pesquisa aponta Rafael Prudente com maior aprovação entre parlamentares do DF na área de saúde.',
    sentiment: 'positive', category: 'elogio', likes: 890, shares: 234, date: '2026-02-13T07:30:00Z', url: '#',
  },
];

export const AI_INSIGHTS = [
  {
    id: '1',
    type: 'opportunity' as const,
    title: 'Oportunidade em Saúde Pública',
    description: 'Menções sobre saúde cresceram 34% na última semana. O público responde muito positivamente a ações concretas na área. Recomenda-se intensificar comunicação sobre entregas de saúde.',
    confidence: 92,
    impact: 'high' as const,
    date: '2026-02-18',
  },
  {
    id: '2',
    type: 'alert' as const,
    title: 'Crescimento de reclamações sobre segurança',
    description: 'Aumento de 18% em menções negativas sobre segurança, especialmente em Sobradinho e Gama. Considere visitas presenciais e anúncio de ações específicas para essas regiões.',
    confidence: 87,
    impact: 'high' as const,
    date: '2026-02-17',
  },
  {
    id: '3',
    type: 'trend' as const,
    title: 'Adversário A perdendo engajamento',
    description: 'O principal adversário teve queda de 22% no engajamento nas últimas 2 semanas. Este é um momento estratégico para ampliar a comunicação e conquistar eleitores indecisos.',
    confidence: 78,
    impact: 'medium' as const,
    date: '2026-02-16',
  },
  {
    id: '4',
    type: 'recommendation' as const,
    title: 'Fortalecer presença no TikTok',
    description: 'O TikTok apresenta o maior crescimento de menções (+45%) e a faixa 18-34 anos é a mais engajada. Conteúdos curtos sobre entregas têm viralizado. Investir em conteúdo para essa plataforma.',
    confidence: 85,
    impact: 'medium' as const,
    date: '2026-02-15',
  },
  {
    id: '5',
    type: 'opportunity' as const,
    title: 'Educação como pauta positiva',
    description: 'Reforma de escolas gerou forte reação positiva nas redes. Criar série de conteúdo mostrando antes/depois das reformas pode amplificar o sentimento positivo.',
    confidence: 90,
    impact: 'high' as const,
    date: '2026-02-14',
  },
];

export const ANALYZED_EVENTS = [
  {
    id: '1',
    title: 'Inauguração Hospital Ceilândia',
    date: '2026-02-10',
    type: 'inauguração',
    mentions_before: 234,
    mentions_after: 1456,
    sentiment_before: 0.55,
    sentiment_after: 0.82,
    reach: 890000,
    top_reaction: 'Aprovação',
    impact_score: 9.2,
    summary: 'A inauguração do hospital gerou um aumento de 522% nas menções e o sentimento positivo subiu de 55% para 82%. Maior pico de aprovação dos últimos 3 meses.',
  },
  {
    id: '2',
    title: 'Fala sobre Segurança Pública na CLDF',
    date: '2026-02-05',
    type: 'discurso',
    mentions_before: 189,
    mentions_after: 876,
    sentiment_before: 0.48,
    sentiment_after: 0.42,
    reach: 560000,
    top_reaction: 'Divisão',
    impact_score: 6.8,
    summary: 'O discurso gerou reações mistas. Apoiadores elogiaram a firmeza, mas críticos apontaram falta de ações concretas. Recomenda-se follow-up com anúncio de medidas específicas.',
  },
  {
    id: '3',
    title: 'Visita a Escolas em Taguatinga',
    date: '2026-01-28',
    type: 'visita',
    mentions_before: 145,
    mentions_after: 678,
    sentiment_before: 0.60,
    sentiment_after: 0.78,
    reach: 340000,
    top_reaction: 'Aprovação',
    impact_score: 7.5,
    summary: 'Visita bem recebida. Fotos de antes/depois das reformas viralizaram no Instagram. A região de Taguatinga apresentou aumento de 12% na aprovação geral.',
  },
  {
    id: '4',
    title: 'Entrevista TV Brasília - Plano de Governo',
    date: '2026-01-20',
    type: 'mídia',
    mentions_before: 312,
    mentions_after: 1234,
    sentiment_before: 0.52,
    sentiment_after: 0.68,
    reach: 1200000,
    top_reaction: 'Interesse',
    impact_score: 8.1,
    summary: 'Entrevista ampliou significativamente o alcance. As propostas para infraestrutura e saúde foram os pontos mais comentados positivamente. Adversários reagiram negativamente.',
  },
];

export const REPORT_TEMPLATES = [
  { id: '1', title: 'Relatório Semanal de Sentimento', type: 'semanal', lastGenerated: '2026-02-17', format: 'PDF' },
  { id: '2', title: 'Comparativo com Adversários', type: 'mensal', lastGenerated: '2026-02-01', format: 'PDF' },
  { id: '3', title: 'Análise de Evento Específico', type: 'sob_demanda', lastGenerated: '2026-02-10', format: 'PDF' },
  { id: '4', title: 'Relatório Demográfico', type: 'mensal', lastGenerated: '2026-02-01', format: 'Excel' },
  { id: '5', title: 'Resumo Executivo para Campanha', type: 'semanal', lastGenerated: '2026-02-17', format: 'PDF' },
];
