

## Plano: Melhorias Completas no Modulo de Opiniao Publica

### Resumo

Implementar 5 melhorias no sistema de raspagem e automacao do modulo de Opiniao Publica: (1) coleta real de comentarios do YouTube, (2) cron job automatico de coleta, (3) cron job de agregacao diaria, (4) raspagem de portais de noticias locais do DF, e (5) raspagem do Reddit.

---

### 1. Coleta Real de Comentarios do YouTube (Actor Pago)

**Situacao atual**: A funcao `collectYouTubeComments` busca apenas metadados de video (titulo, descricao, views) porque o Stage 2 (comentarios) esta desabilitado (linha 860-861: `const commentItems: any[] = [];`).

**O que muda**:
- Ativar o Stage 2 usando o actor `crawlerbros~youtube-comment-scraper` (ja mapeado em `APIFY_ACTORS`)
- Buscar ate 100 comentarios dos 10 videos mais recentes do canal
- Manter o fallback de metadados caso o scraper de comentarios falhe

**Arquivo**: `supabase/functions/po-collect-mentions/index.ts`
- Substituir `const commentItems: any[] = [];` pela chamada real ao actor Apify
- Mapear os campos do actor para o schema de `po_mentions`

---

### 2. Raspagem de Portais de Noticias Locais do DF

**O que muda**: Adicionar uma nova fonte `portais_df` que raspa 3 portais locais usando Zenscrape:
- Metropoles (`metropoles.com`)
- Correio Braziliense (`correiobraziliense.com.br`)
- G1 DF (`g1.globo.com/df`)

**Arquivo**: `supabase/functions/po-collect-mentions/index.ts`
- Nova funcao `collectPortaisDF` que usa Zenscrape para buscar paginas de busca desses portais
- Novo bloco no handler principal para source `portais_df`
- Reutiliza a logica existente de `extractMentionsFromHTML` com source `portais_df`

**Arquivo**: `src/pages/public-opinion/Overview.tsx`
- Adicionar cor `portais_df` no mapa de cores do grafico

**Arquivo**: `src/pages/public-opinion/Comments.tsx`
- Adicionar opcao "Portais DF" no filtro de fontes

---

### 3. Raspagem do Reddit

**O que muda**: Adicionar fonte `reddit` usando actor Apify `trudax~reddit-scraper` para buscar posts e comentarios nos subreddits r/brasilia e r/brasil.

**Arquivo**: `supabase/functions/po-collect-mentions/index.ts`
- Novo actor no mapa: `reddit: "trudax~reddit-scraper"`
- Nova funcao `collectReddit` que busca posts mencionando a entidade
- Novo bloco no handler para source `reddit`

**Arquivo**: `src/pages/public-opinion/Overview.tsx`
- Adicionar cor `reddit: '#FF4500'` no mapa

**Arquivo**: `src/pages/public-opinion/Comments.tsx`
- Adicionar "Reddit" no filtro de fontes

---

### 4. Cron Job de Coleta Automatica de Mencoes

**O que muda**: Criar uma nova Edge Function `po-auto-collect` que:
1. Le todas as entidades ativas com `po_collection_configs` ativas
2. Verifica se `next_run_at` ja passou (ou nunca rodou)
3. Determina quais fontes coletar com base nas redes sociais configuradas
4. Chama `po-collect-mentions` em background para cada entidade
5. Atualiza `last_run_at` e `next_run_at` na tabela `po_collection_configs`

**Arquivos**:
- `supabase/functions/po-auto-collect/index.ts` (novo)
- `supabase/config.toml` - adicionar `[functions.po-auto-collect] verify_jwt = false`
- Cron job SQL: executa a cada 30 minutos (`*/30 * * * *`)

---

### 5. Cron Job de Agregacao Diaria (po_daily_snapshots)

**O que muda**: Criar uma nova Edge Function `po-aggregate-daily` que:
1. Para cada entidade ativa, agrega dados de `po_sentiment_analyses` do dia anterior
2. Calcula: total_mentions, positive_count, negative_count, neutral_count, avg_sentiment_score, top_topics, top_emotions, source_breakdown
3. Faz UPSERT na tabela `po_daily_snapshots`

**Arquivos**:
- `supabase/functions/po-aggregate-daily/index.ts` (novo)
- `supabase/config.toml` - adicionar `[functions.po-aggregate-daily] verify_jwt = false`
- Cron job SQL: executa 1x por dia as 03:00 (`0 3 * * *`)

---

### 6. Integracao no Frontend

**Atualizacoes para refletir as novas fontes**:

**`src/pages/public-opinion/Overview.tsx`**:
- Adicionar cores: `portais_df: '#8B5CF6'`, `reddit: '#FF4500'`
- Incluir `portais_df` e `reddit` na lista de fontes do botao "Coletar Mencoes"

**`src/pages/public-opinion/Comments.tsx`**:
- Adicionar "Portais DF" e "Reddit" no filtro de fontes

**`src/hooks/public-opinion/usePublicOpinion.ts`**:
- Nenhuma alteracao necessaria (ja e dinamico)

---

### Detalhes Tecnicos

```text
Arquivos novos:
  supabase/functions/po-auto-collect/index.ts
  supabase/functions/po-aggregate-daily/index.ts

Arquivos editados:
  supabase/functions/po-collect-mentions/index.ts  (YouTube real, Portais DF, Reddit)
  src/pages/public-opinion/Overview.tsx             (cores + fontes)
  src/pages/public-opinion/Comments.tsx             (filtros)
  supabase/config.toml                              (2 novas functions)

Cron Jobs (via SQL insert):
  po-auto-collect       -> */30 * * * *  (a cada 30 min)
  po-aggregate-daily    -> 0 3 * * *     (diario as 03:00)
```

### Actors Apify Utilizados

| Fonte | Actor | Tipo |
|-------|-------|------|
| YouTube Comments | `crawlerbros~youtube-comment-scraper` | Pago |
| Reddit | `trudax~reddit-scraper` | Pago |
| Portais DF | Zenscrape (ja configurado) | Existente |

