# Módulo de Opinião Pública — Documentação Completa

> Documento técnico exaustivo para reconstrução ou replicação independente do sistema de monitoramento de opinião pública.

---

## 1. Visão Geral do Módulo

O módulo de Opinião Pública é um sistema completo de **monitoramento de imagem política** que coleta menções em mais de 21 fontes (redes sociais, portais de notícias, buscadores), analisa sentimento via IA (Gemini), agrega dados temporalmente e gera insights estratégicos automatizados.

### Acesso
- Restrito a usuários com role `super_admin`
- 10 sub-páginas sob a rota `/public-opinion/*`

### Stack Técnica
- **Frontend:** React + TypeScript + TanStack Query + Recharts
- **Backend:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **IA:** Google Gemini 3 Flash Preview (via Lovable AI Gateway)
- **Scraping:** Apify Actors + Zenscrape API
- **Relatórios:** jsPDF (PDF) + xlsx (Excel)

---

## 2. Banco de Dados — Esquema Completo

### 2.1 `po_monitored_entities` — Entidades Monitoradas

Armazena os políticos, adversários, partidos ou temas que o sistema monitora.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `nome` | text | NO | — | Nome da entidade (ex: "Rafael Prudente") |
| `tipo` | text | NO | `'politico'` | `politico`, `adversario`, `partido`, `tema` |
| `partido` | text | YES | — | Sigla partidária |
| `cargo` | text | YES | — | Cargo político |
| `redes_sociais` | jsonb | YES | `'{}'` | Handles das redes sociais + configs extras |
| `hashtags` | text[] | YES | `'{}'` | Hashtags a monitorar |
| `palavras_chave` | text[] | YES | `'{}'` | Palavras-chave de busca |
| `is_principal` | boolean | NO | `false` | Se é a entidade principal (seu candidato) |
| `is_active` | boolean | NO | `true` | Soft delete |
| `avatar_url` | text | YES | — | URL do avatar |
| `created_at` | timestamptz | NO | `now()` | |
| `updated_at` | timestamptz | NO | `now()` | |

**Estrutura do campo `redes_sociais` (JSONB):**
```json
{
  "twitter": "@handle",
  "instagram": "@handle",
  "facebook": "pagina-oficial",
  "youtube": "@canal",
  "tiktok": "@handle",
  "telegram": "canal1,canal2",
  "threads": "@handle",
  "influenciadores_ig": "@perfil1, @perfil2",
  "sites_customizados": "https://site1.com, https://site2.com"
}
```

**RLS:** SELECT/ALL restrito a `super_admin`.

---

### 2.2 `po_mentions` — Menções Coletadas

Armazena cada menção bruta coletada das fontes externas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `entity_id` | uuid | NO | — | FK → `po_monitored_entities.id` |
| `source` | text | NO | — | Fonte (ex: `twitter`, `instagram`, `news`, `google_news`, etc.) |
| `source_url` | text | YES | — | URL original da menção |
| `author_name` | text | YES | — | Nome do autor |
| `author_handle` | text | YES | — | Handle/username do autor |
| `content` | text | NO | — | Conteúdo da menção (até 2000 chars) |
| `published_at` | timestamptz | YES | — | Data de publicação original |
| `collected_at` | timestamptz | NO | `now()` | Data de coleta |
| `engagement` | jsonb | YES | `'{}'` | Métricas de engajamento |
| `hashtags` | text[] | YES | `'{}'` | Hashtags da menção |
| `media_urls` | text[] | YES | `'{}'` | URLs de mídia |
| `raw_data` | jsonb | YES | — | Dados brutos do scraper |
| `created_at` | timestamptz | NO | `now()` | |

**Estrutura do campo `engagement` (JSONB):**
```json
{
  "likes": 150,
  "shares": 30,
  "comments": 12,
  "views": 5000,
  "saves": 8,
  "bookmarks": 3,
  "quotes": 2,
  "reaction_types": { "love": 5, "haha": 2 }
}
```

**Valores possíveis de `source`:**
`twitter`, `twitter_comments`, `instagram`, `instagram_comments`, `facebook`, `facebook_comments`, `tiktok`, `tiktok_comments`, `youtube_comments`, `youtube_search`, `news`, `google_news`, `google_search`, `portais_df`, `portais_br`, `reddit`, `telegram`, `threads`, `influencer_comments`, `sites_custom`, `fontes_oficiais`

**RLS:** SELECT/ALL restrito a `super_admin`.

---

### 2.3 `po_sentiment_analyses` — Análises de Sentimento

Cada menção analisada gera um registro com classificação de sentimento, categoria, tópicos e emoções.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `mention_id` | uuid | NO | — | FK → `po_mentions.id` |
| `entity_id` | uuid | NO | — | FK → `po_monitored_entities.id` |
| `sentiment` | text | NO | — | `positivo`, `negativo`, `neutro` |
| `sentiment_score` | numeric | YES | — | Score de -1.000 (negativo) a 1.000 (positivo) |
| `category` | text | YES | — | Categoria da menção |
| `subcategory` | text | YES | — | Subcategoria livre |
| `topics` | text[] | YES | `'{}'` | Temas detectados |
| `emotions` | text[] | YES | `'{}'` | Emoções detectadas |
| `is_about_adversary` | boolean | YES | `false` | Se menciona adversário |
| `adversary_entity_id` | uuid | YES | — | FK → `po_monitored_entities.id` |
| `confidence` | numeric | YES | — | Confiança da análise (0.00 a 1.00) |
| `ai_summary` | text | YES | — | Resumo de 1 linha da análise |
| `ai_model` | text | YES | — | Modelo usado (ex: `google/gemini-3-flash-preview`) |
| `analyzed_at` | timestamptz | NO | `now()` | |
| `created_at` | timestamptz | NO | `now()` | |

**Categorias possíveis:** `elogio`, `reclamação`, `dúvida`, `sugestão`, `notícia`, `ataque`, `defesa`, `humor`, `fake_news`

**Tópicos possíveis:** `saúde`, `segurança`, `educação`, `transporte`, `meio_ambiente`, `economia`, `infraestrutura`, `política`, `social`, `cultura`, `esporte`

**Emoções possíveis:** `raiva`, `esperança`, `medo`, `alegria`, `tristeza`, `indignação`, `orgulho`, `deboche`, `ironia`

**RLS:** SELECT/ALL restrito a `super_admin`.

---

### 2.4 `po_daily_snapshots` — Agregados Diários

Consolidação diária das métricas para gráficos de evolução temporal.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `entity_id` | uuid | NO | — | FK → `po_monitored_entities.id` |
| `snapshot_date` | date | NO | — | Data do snapshot |
| `total_mentions` | integer | YES | `0` | Total de menções no dia |
| `positive_count` | integer | YES | `0` | Contagem positivas |
| `negative_count` | integer | YES | `0` | Contagem negativas |
| `neutral_count` | integer | YES | `0` | Contagem neutras |
| `avg_sentiment_score` | numeric | YES | `0` | Score médio do dia |
| `top_topics` | text[] | YES | `'{}'` | Top 10 tópicos (JSONB serializado) |
| `top_emotions` | text[] | YES | `'{}'` | Top 10 emoções (JSONB serializado) |
| `engagement_total` | jsonb | YES | `'{}'` | Engajamento consolidado |
| `source_breakdown` | jsonb | YES | `'{}'` | Breakdown por fonte |
| `created_at` | timestamptz | NO | `now()` | |

**Constraint UNIQUE:** `(entity_id, snapshot_date)` — permite upsert.

**RLS:** SELECT/ALL restrito a `super_admin`.

---

### 2.5 `po_events` — Eventos Políticos

Eventos públicos registrados para análise de impacto na opinião pública.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `entity_id` | uuid | NO | — | FK → `po_monitored_entities.id` |
| `titulo` | text | NO | — | Título do evento |
| `descricao` | text | YES | — | Descrição |
| `data_evento` | timestamptz | NO | — | Data do evento |
| `tipo` | text | NO | `'acao'` | Tipo: `acao`, `crise`, `debate`, `inauguração`, etc. |
| `impacto_score` | numeric | YES | — | Score de impacto (0-10) |
| `total_mentions` | integer | YES | `0` | Total de menções relacionadas |
| `sentiment_positivo_pct` | numeric | YES | `0` | % positivo |
| `sentiment_negativo_pct` | numeric | YES | `0` | % negativo |
| `sentiment_neutro_pct` | numeric | YES | `0` | % neutro |
| `ai_analysis` | text | YES | — | Análise de IA sobre o impacto |
| `tags` | text[] | YES | `'{}'` | Tags do evento |
| `is_active` | boolean | YES | `true` | Soft delete |
| `created_at` | timestamptz | NO | `now()` | |
| `updated_at` | timestamptz | NO | `now()` | |

---

### 2.6 `po_insights` — Insights de IA Persistidos

Armazena insights estratégicos gerados pela IA para evitar regeneração.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `entity_id` | uuid | NO | — | FK → `po_monitored_entities.id` |
| `period_days` | integer | NO | `7` | Período analisado |
| `insights` | jsonb | NO | `'[]'` | Array de insights |
| `stats` | jsonb | NO | `'{}'` | Estatísticas de sentimento |
| `generated_at` | timestamptz | NO | `now()` | Data de geração |
| `created_at` | timestamptz | NO | `now()` | |

**Estrutura de cada insight (JSONB):**
```json
{
  "type": "oportunidade|alerta|tendência|recomendação",
  "priority": "alta|média|baixa",
  "confidence": 0.85,
  "title": "Título curto e impactante",
  "description": "Descrição detalhada com ação recomendada",
  "topics": ["saúde", "infraestrutura"]
}
```

---

### 2.7 `po_collection_configs` — Configurações de Coleta Automática

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `entity_id` | uuid | NO | — | FK → `po_monitored_entities.id` |
| `provider` | text | NO | — | `zenscrape`, `datastream` |
| `config` | jsonb | YES | `'{}'` | Configurações específicas do provider |
| `is_active` | boolean | YES | `true` | Se a coleta está ativa |
| `last_run_at` | timestamptz | YES | — | Última execução |
| `next_run_at` | timestamptz | YES | — | Próxima execução |
| `run_interval_minutes` | integer | YES | `60` | Intervalo em minutos |
| `last_error` | text | YES | — | Último erro |
| `created_at` | timestamptz | NO | `now()` | |
| `updated_at` | timestamptz | NO | `now()` | |

---

### 2.8 Função RPC: `get_unanalyzed_mention_ids`

```sql
-- Retorna IDs de menções que ainda não possuem análise de sentimento
CREATE FUNCTION get_unanalyzed_mention_ids(_entity_id uuid, _limit integer DEFAULT 200)
RETURNS TABLE(id uuid)
AS $$
  SELECT m.id
  FROM po_mentions m
  LEFT JOIN po_sentiment_analyses a ON a.mention_id = m.id
  WHERE m.entity_id = _entity_id AND a.id IS NULL
  ORDER BY m.collected_at DESC
  LIMIT _limit;
$$ LANGUAGE sql STABLE;
```

---

## 3. Edge Functions — Backend

### 3.1 `po-collect-mentions` — Coleta de Menções (~2150 linhas)

**Responsabilidade:** Coleta menções em 21+ fontes, deduplica e persiste no banco.

**Fluxo:**
1. Recebe `{ entity_id, sources?, query? }`
2. Busca configuração da entidade no banco (nome, redes sociais, palavras-chave)
3. Retorna resposta imediata com `{ background: true }` ao frontend
4. Processa em segundo plano via `EdgeRuntime.waitUntil()`
5. Para cada fonte ativada, executa o scraper correspondente
6. Deduplica: compara primeiros 200 chars com as últimas 500 menções existentes
7. Insere menções únicas no banco
8. Dispara automaticamente `analyze-sentiment` para as novas menções

**Integrações externas:**

#### Apify Actors (via REST API)
| Fonte | Actor ID | Timeout |
|-------|----------|---------|
| Twitter | `apidojo~tweet-scraper` | 50s |
| Instagram Scraper | `apify~instagram-scraper` | 45s |
| Instagram Search | `apify~instagram-search-scraper` | 45s |
| Instagram Hashtag | `apify~instagram-hashtag-scraper` | 45s |
| Instagram Comments | `apify~instagram-comment-scraper` | 45s |
| Facebook Posts | `apify~facebook-posts-scraper` | 22s |
| Facebook Search | `powerai~facebook-post-search-scraper` | 22s |
| Facebook Comments | `apify~facebook-comments-scraper` | 90s |
| TikTok | `clockworks~tiktok-scraper` + `apidojo~tiktok-scraper` + `sociavault~tiktok-keyword-search-scraper` | 40-45s |
| TikTok Comments | `apidojo~tiktok-comments-scraper` | 45s |
| YouTube Comments | `crawlerbros~youtube-comment-scraper` | 45s |
| YouTube Search | `bernardo~youtube-scraper` | 50s |
| Reddit | `trudax~reddit-scraper` | 30s |
| Telegram | `lexer~telegram-channel-post-scraper` | 45s |
| Threads | `apify~threads-scraper` | 50s |
| Google News | `dlaf~google-news-free` | 60s |
| Google Search | `apify~google-search-scraper` | 45s |

**Endpoint Apify:** `https://api.apify.com/v2/acts/{actorId}/run-sync-get-dataset-items?token={token}&timeout={secs}&format=json`

**Secret:** `APIFY_API_TOKEN`

#### Zenscrape (para Bing/Yahoo News + portais)
- **Endpoint:** `https://app.zenscrape.com/api/v1/get?url={encodedUrl}`
- **Header:** `apikey: {ZENSCRAPE_API_KEY}`
- **Timeout:** 20s
- Extrai menções via regex que captura sentenças contendo o nome da entidade do HTML limpo

**Secret:** `ZENSCRAPE_API_KEY`

**Estratégia por plataforma:**

- **Twitter:** 5 queries paralelas (nome+cargo, @handle, nome+geo, nome+legislativo, nome puro) × 25 tweets cada
- **Instagram:** 7 queries paralelas (scraper oficial, search por keyword ×3, hashtag ×3) com dedupe por shortCode/id
- **Facebook:** 5 queries paralelas (keyword search ×4 + página oficial) via powerai e apify actors
- **TikTok:** Etapa 1 busca vídeos, Etapa 2 coleta comentários dos vídeos encontrados. Etapa 2 é disparada como chamada assíncrona interna
- **YouTube:** Busca canais do perfil → coleta comentários dos vídeos mais recentes
- **Influencers:** Scraping direcionado de posts que mencionam a entidade + extração de comentários
- **Portais DF:** Scraping de Metrópoles, Correio Braziliense, G1 DF + sites customizados
- **Portais BR:** Portais nacionais (UOL, Folha, Estadão, G1)
- **Fontes Oficiais:** Agência Câmara, Agência Senado, TSE

**Algoritmo de Deduplicação:**
```
1. Buscar últimas 500 menções do banco (por entity_id)
2. Criar Set com substring(0, 200) de cada content
3. Para cada nova menção, verificar se substring(0, 200) existe no Set
4. Inserir apenas menções cujo conteúdo é único
```

---

### 3.2 `analyze-sentiment` — Análise de Sentimento via IA (~267 linhas)

**Responsabilidade:** Processa menções em lotes e classifica sentimento, categoria, tópicos e emoções via IA.

**Fluxo:**
1. Recebe `{ entity_id, mention_ids?, analyze_pending? }`
2. Se `analyze_pending=true` ou sem `mention_ids`, busca via RPC `get_unanalyzed_mention_ids` (limite 200)
3. Busca os dados das menções + entidade + adversários cadastrados
4. Divide em batches de **25 menções**
5. Para cada batch, envia prompt ao Gemini via tool calling
6. Persiste os resultados na tabela `po_sentiment_analyses`
7. Após conclusão, dispara `po-aggregate-daily` para o dia atual
8. Processamento em segundo plano via `EdgeRuntime.waitUntil()`

**Prompt da IA (system):**
```
Você é um analista especializado em opinião pública e comunicação política brasileira.
Contexto: Entidade principal + adversários conhecidos
```

**Schema do tool call `save_sentiment_analyses`:**
```json
{
  "analyses": [{
    "mention_index": 0,
    "sentiment": "positivo|negativo|neutro",
    "sentiment_score": -1.000 a 1.000,
    "category": "elogio|reclamação|dúvida|sugestão|notícia|ataque|defesa|humor|fake_news",
    "subcategory": "string",
    "topics": ["saúde", "segurança"],
    "emotions": ["raiva", "esperança"],
    "is_about_adversary": false,
    "adversary_name": "string ou null",
    "confidence": 0.00 a 1.00,
    "ai_summary": "resumo de 1 linha"
  }]
}
```

**Regra de relevância:** Se a menção NÃO é sobre a entidade principal (homônimo, conteúdo genérico), a IA marca `confidence: 0.00` e `ai_summary` começa com "Menção irrelevante:".

**Modelo:** `google/gemini-3-flash-preview`
**Endpoint:** `https://ai.gateway.lovable.dev/v1/chat/completions`
**Auth:** `Bearer {LOVABLE_API_KEY}` (secret automático)

---

### 3.3 `po-generate-insights` — Geração de Insights Estratégicos (~213 linhas)

**Responsabilidade:** Gera 4-8 insights estratégicos acionáveis baseados nos dados acumulados.

**Fluxo:**
1. Recebe `{ entity_id, period_days? }` (default 7 dias)
2. Busca ALL análises de sentimento do período (com paginação)
3. Calcula estatísticas agregadas: total, positivo, negativo, neutro, score médio
4. Conta frequência de tópicos, categorias e emoções
5. Busca snapshots diários para tendência
6. Monta prompt com todos os dados + últimos 30 resumos de menções
7. Envia ao Gemini via tool call `save_insights`
8. Persiste resultado na tabela `po_insights`

**Schema do tool call `save_insights`:**
```json
{
  "insights": [{
    "type": "oportunidade|alerta|tendência|recomendação",
    "priority": "alta|média|baixa",
    "confidence": 0.00 a 1.00,
    "title": "Título curto e impactante",
    "description": "Descrição detalhada com ação recomendada",
    "topics": ["saúde"]
  }]
}
```

---

### 3.4 `po-aggregate-daily` — Agregação Diária (~168 linhas)

**Responsabilidade:** Consolida dados de análises e menções em snapshots diários.

**Fluxo:**
1. Recebe `{ date? }` (default: ontem)
2. Para cada entidade ativa:
   a. Busca análises do dia (sentimento, score, tópicos, emoções)
   b. Busca menções do dia (fonte)
   c. Calcula: total, positivos, negativos, neutros, score médio, top tópicos, top emoções, breakdown por fonte
   d. Upsert no `po_daily_snapshots` (conflict on `entity_id, snapshot_date`)

**Triggers de execução:**
- **pg_cron:** Diariamente às 03:00 (agrega dia anterior)
- **Post-análise:** Chamado pelo `analyze-sentiment` após cada processamento em background (agrega dia atual)

---

### 3.5 `po-auto-collect` — Coleta Automática (~111 linhas)

**Responsabilidade:** Orquestrador de coleta automática disparado por pg_cron.

**Fluxo:**
1. Busca `po_collection_configs` ativas com join em `po_monitored_entities`
2. Para cada config cujo `next_run_at` já passou:
   a. Determina fontes baseadas nas redes sociais configuradas da entidade
   b. Dispara `po-collect-mentions` via HTTP fire-and-forget
   c. Atualiza `last_run_at` e calcula `next_run_at`

**pg_cron:** Executa a cada 12 horas.

---

## 4. Frontend — Arquitetura

### 4.1 Rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/public-opinion` | `Overview` | Dashboard principal com KPIs |
| `/public-opinion/timeline` | `Timeline` | Evolução temporal + eventos |
| `/public-opinion/sentiment` | `SentimentAnalysis` | Radar por categoria + menções classificadas |
| `/public-opinion/comments` | `Comments` | Listagem paginada de menções |
| `/public-opinion/comparison` | `Comparison` | Comparação entre entidades |
| `/public-opinion/demographics` | `Demographics` | Análise de conteúdo por fonte/categoria |
| `/public-opinion/events` | `AnalyzedEvents` | Eventos e impacto |
| `/public-opinion/insights` | `Insights` | Insights de IA |
| `/public-opinion/reports` | `Reports` | Geração de relatórios PDF/Excel |
| `/public-opinion/settings` | `Settings` | Configuração de entidades e coleta |

### 4.2 Provider de Realtime

O `PublicOpinionRealtimeProvider` envolve todas as páginas do módulo e ativa subscriptions Supabase Realtime para:
- `po_mentions` (filtrado por entity_id)
- `po_sentiment_analyses` (filtrado por entity_id)
- `po_daily_snapshots` (filtrado por entity_id)
- `po_monitored_entities` (sem filtro)

Quando há mudança, as queries do React Query são invalidadas automaticamente.

### 4.3 Hooks Principais

#### `usePublicOpinion.ts` — Hook Central
- `useMonitoredEntities()` — Lista entidades ativas (principal primeiro)
- `useMentions(entityId, source, limit)` — Busca menções com filtro
- `useSentimentAnalyses(entityId, days)` — Busca análises com **paginação além de 1000**
- `usePendingMentionsCount(entityId)` — Contagem exata de menções não analisadas (polling 30s)
- `useDailySnapshots(entityId, days)` — Snapshots diários com filtro `lte` para incluir dia atual
- `usePoEvents(entityId)` — Eventos registrados
- `useCollectMentions()` — Mutation para disparar coleta
- `useAnalyzePending()` — Mutation para analisar menções pendentes
- `useGenerateInsights()` — Mutation para gerar insights
- `usePoOverviewStats(entityId)` — Computed: agrega análises, filtra irrelevantes, calcula KPIs

#### `useCommentsPageData.ts` — Paginação Server-Side
- Suporta filtros: `sentiment`, `category`, `source`, `search` (ilike)
- Paginação via `.range(from, to)` + `count: 'exact'`
- Normalização de acentos para categorias (ex: `notícia`/`noticia`)
- Duas estratégias: se filtro por sentimento/categoria → query via `po_sentiment_analyses`; senão → query via `po_mentions`

#### `usePoReportData.ts` — Dados para Relatórios
- `fetchAllPaginated()` — Helper genérico que pagina além do limite de 1000
- Funções específicas: `fetchWeeklyReportData`, `fetchComparisonReportData`, `fetchEventReportData`, `fetchDemographicReportData`, `fetchExecutiveReportData`

### 4.4 Filtro de Relevância

O sistema aplica um filtro client-side para excluir menções classificadas como irrelevantes pela IA:

```typescript
const IRRELEVANT_KEYWORDS = [
  "irrelevante", "sem relação", "sem cunho político", "não se refere",
  "não está relacionad", "sem conexão", "não menciona", "sem relevância",
  "não é sobre", "sem vínculo", "conteúdo genérico",
];

function isRelevantAnalysis(a: SentimentAnalysis): boolean {
  if (a.ai_summary) {
    const lower = a.ai_summary.toLowerCase();
    if (IRRELEVANT_KEYWORDS.some(kw => lower.includes(kw))) return false;
  }
  if (a.category === "humor" && (a.sentiment_score === 0 || a.sentiment_score === null)) return false;
  return true;
}
```

### 4.5 Normalização de Score

O sentiment_score bruto varia de -1.0 a 1.0. A normalização para exibição na interface é:

```typescript
// Para escala 0-10:
const score010 = Math.round(((rawAvg + 1) / 2) * 100) / 10;

// Alternativa usada em Overview:
const score010 = Math.round((avgScore + 1) * 5 * 10) / 10;
```

### 4.6 Fallback para Dados Demo

Todas as páginas implementam:
1. Verificação se há dados reais: `const hasRealData = analyses && analyses.length > 0`
2. Se não há dados → usa constantes de `demoPublicOpinionData.ts`
3. Exibe badge `<Badge variant="outline">Demo</Badge>`
4. Se há dados reais → exibe indicador "● Ao vivo"

---

## 5. Relatórios

### 5.1 Tipos de Relatórios

| # | Nome | Formato | Período | Conteúdo |
|---|------|---------|---------|----------|
| 1 | Semanal de Sentimento | PDF | 7 dias | KPIs, snapshots diários, top tópicos/emoções, 10 menções |
| 2 | Comparativo com Adversários | PDF | 30 dias | Tabela comparativa todas entidades |
| 3 | Análise de Evento | PDF | ±7 dias do evento | Impacto, sentimento antes/depois, menções |
| 4 | Demográfico por Fonte | Excel | 30 dias | Breakdown por fonte com % sentimento |
| 5 | Resumo Executivo | PDF | 7 dias | 1 página: KPIs + tendência + top tópicos |

### 5.2 Geração

- **PDF:** via `jsPDF` (`src/utils/generatePoReportPdf.ts`)
  - Cor primária: `#F05023`
  - Cabeçalho com título + data
  - Tabelas com alternância de cores
  - Rodapé com nome da entidade

- **Excel:** via `xlsx` (`src/utils/generatePoReportExcel.ts`)
  - Headers formatados
  - Colunas auto-dimensionadas

---

## 6. Fluxo Completo — Pipeline de Dados

```
┌─────────────────┐
│  TRIGGER         │  Manual (botão "Coletar Menções")
│                  │  Automático (pg_cron → po-auto-collect a cada 12h)
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  po-collect-mentions (Edge Function)             │
│  • Retorna imediatamente { background: true }    │
│  • EdgeRuntime.waitUntil() para processamento    │
│  • 21 fontes via Apify + Zenscrape               │
│  • Queries paralelas por plataforma              │
│  • Deduplicação por primeiros 200 chars          │
│  • Insert em po_mentions                         │
│  • Dispara analyze-sentiment automaticamente     │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  analyze-sentiment (Edge Function)               │
│  • Batches de 25 menções                         │
│  • Prompt com contexto da entidade + adversários │
│  • Gemini 3 Flash via tool calling               │
│  • Insert em po_sentiment_analyses               │
│  • Dispara po-aggregate-daily para dia atual     │
│  • EdgeRuntime.waitUntil() para background       │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  po-aggregate-daily (Edge Function)              │
│  • Para cada entidade ativa:                     │
│    - Conta positivos/negativos/neutros do dia    │
│    - Calcula score médio                         │
│    - Top tópicos/emoções                         │
│    - Breakdown por fonte                         │
│  • Upsert em po_daily_snapshots                  │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Supabase Realtime                               │
│  • Detecta INSERT/UPDATE em po_mentions,         │
│    po_sentiment_analyses, po_daily_snapshots      │
│  • Invalida queries do React Query               │
│  • Frontend atualiza automaticamente             │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  po-generate-insights (Edge Function)            │
│  • Disparado manualmente (botão "Gerar Insights")│
│  • Busca ALL análises do período com paginação   │
│  • Calcula estatísticas agregadas                │
│  • Prompt com dados + resumos recentes           │
│  • Gemini 3 Flash via tool calling               │
│  • Persiste em po_insights                       │
└─────────────────────────────────────────────────┘
```

---

## 7. Secrets Necessários

| Secret | Onde é usado | Descrição |
|--------|-------------|-----------|
| `APIFY_API_TOKEN` | `po-collect-mentions` | Token da API Apify para scraping |
| `ZENSCRAPE_API_KEY` | `po-collect-mentions` | API key do Zenscrape para news |
| `LOVABLE_API_KEY` | `analyze-sentiment`, `po-generate-insights` | Token para AI Gateway (provido automaticamente) |
| `SUPABASE_URL` | Todas as Edge Functions | URL do projeto (automático) |
| `SUPABASE_SERVICE_ROLE_KEY` | Todas as Edge Functions | Service role key (automático) |

---

## 8. Automação (pg_cron)

| Schedule | Função | Descrição |
|----------|--------|-----------|
| `0 */12 * * *` | `po-auto-collect` | Coleta automática a cada 12h |
| `0 3 * * *` | `po-aggregate-daily` | Agregação diária às 03:00 |

---

## 9. Padrões de Resiliência

1. **Background processing:** Todas as Edge Functions pesadas usam `EdgeRuntime.waitUntil()` e retornam resposta imediata
2. **Paginação:** Queries que podem exceder 1000 registros usam loop com `.range()` 
3. **Error isolation:** Cada fonte de coleta é envolvida em try/catch — falha de uma fonte não impede as demais
4. **Timeouts:** Cada ator Apify tem timeout individual (22s a 90s) + AbortController
5. **Batch processing:** Análise de sentimento em lotes de 25 para evitar timeout da IA
6. **Rate limit handling:** Retorna HTTP 429 ao frontend quando AI Gateway retorna rate limit
7. **Deduplicação:** Substring-based (primeiros 200 chars) para evitar menções duplicadas
8. **Fallback para demo:** Frontend nunca mostra tela vazia — sempre há dados demo como fallback

---

## 10. Métricas e Cálculos

### Score de Sentimento (0-10)
```
score = ((rawAvg + 1) / 2) * 10
```
Onde `rawAvg` é a média dos `sentiment_score` (-1 a 1) das análises relevantes.

### Taxa de Engajamento
```
engRate = totalEngagement / relevantMentionCount
totalEngagement = Σ(likes + comments + shares + views) por menção relevante
```

### Comparação Radar (escala logarítmica)
```
logScale(value, base) = min(log10(value + 1) / log10(base + 1) * 100, 100)
```
Usado para Menções (base 10000), Alcance (base 10M), Engajamento (base 500).

### Menções Pendentes
```
pendentes = COUNT(po_mentions WHERE entity_id = X) - COUNT(po_sentiment_analyses WHERE entity_id = X)
```
Calculado via duas queries HEAD com `count: 'exact'`.

---

## 11. Observações para Replicação

1. O módulo é **independente** do restante do sistema — não compartilha tabelas com outros módulos exceto `user_roles` para controle de acesso
2. As tabelas `po_*` formam um esquema isolado que pode ser replicado em qualquer projeto Supabase
3. A IA Gateway (`ai.gateway.lovable.dev`) é específica da plataforma Lovable — para replicação, substitua por chamadas diretas à API do Gemini/OpenAI
4. Os Apify Actors são serviços pagos por uso — o custo varia por volume de dados coletados
5. O Zenscrape é um serviço de scraping pago com limite de requisições
6. O sistema foi projetado para operar dentro do limite de **150 segundos** das Edge Functions do Supabase
7. A paginação do Supabase tem limite padrão de **1000 registros por query** — o código pagina explicitamente quando necessário
