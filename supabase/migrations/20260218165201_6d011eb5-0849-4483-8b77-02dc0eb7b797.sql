
-- Entidades monitoradas (políticos, marcas, adversários)
CREATE TABLE public.po_monitored_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'politico', -- politico, adversario, marca
  partido TEXT,
  cargo TEXT,
  redes_sociais JSONB DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  palavras_chave TEXT[] DEFAULT '{}',
  is_principal BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.po_monitored_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_entities_select" ON public.po_monitored_entities FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "po_entities_modify" ON public.po_monitored_entities FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Menções coletadas
CREATE TABLE public.po_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.po_monitored_entities(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- twitter, instagram, facebook, news, youtube
  source_url TEXT,
  author_name TEXT,
  author_handle TEXT,
  content TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  engagement JSONB DEFAULT '{}', -- likes, shares, comments, views
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.po_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_mentions_select" ON public.po_mentions FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "po_mentions_modify" ON public.po_mentions FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Análises de sentimento (resultado da IA)
CREATE TABLE public.po_sentiment_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mention_id UUID NOT NULL REFERENCES public.po_mentions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.po_monitored_entities(id) ON DELETE CASCADE,
  sentiment TEXT NOT NULL, -- positivo, negativo, neutro
  sentiment_score NUMERIC(4,3), -- -1.000 a 1.000
  category TEXT, -- elogio, reclamação, dúvida, sugestão, notícia, ataque
  subcategory TEXT,
  topics TEXT[] DEFAULT '{}', -- saúde, segurança, educação, etc
  emotions TEXT[] DEFAULT '{}', -- raiva, esperança, medo, alegria
  is_about_adversary BOOLEAN DEFAULT false,
  adversary_entity_id UUID REFERENCES public.po_monitored_entities(id),
  confidence NUMERIC(3,2), -- 0.00 a 1.00
  ai_summary TEXT,
  ai_model TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.po_sentiment_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_sentiment_select" ON public.po_sentiment_analyses FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "po_sentiment_modify" ON public.po_sentiment_analyses FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Eventos públicos analisados
CREATE TABLE public.po_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.po_monitored_entities(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'acao', -- acao, fala, legislacao, campanha, crise
  impacto_score NUMERIC(3,2), -- 0.00 a 1.00
  total_mentions INTEGER DEFAULT 0,
  sentiment_positivo_pct NUMERIC(5,2) DEFAULT 0,
  sentiment_negativo_pct NUMERIC(5,2) DEFAULT 0,
  sentiment_neutro_pct NUMERIC(5,2) DEFAULT 0,
  ai_analysis TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.po_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_events_select" ON public.po_events FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "po_events_modify" ON public.po_events FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Snapshots diários para gráficos de tendência
CREATE TABLE public.po_daily_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.po_monitored_entities(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_mentions INTEGER DEFAULT 0,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  avg_sentiment_score NUMERIC(4,3) DEFAULT 0,
  top_topics TEXT[] DEFAULT '{}',
  top_emotions TEXT[] DEFAULT '{}',
  engagement_total JSONB DEFAULT '{}',
  source_breakdown JSONB DEFAULT '{}', -- {twitter: 30, instagram: 20, ...}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, snapshot_date)
);

ALTER TABLE public.po_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_snapshots_select" ON public.po_daily_snapshots FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "po_snapshots_modify" ON public.po_daily_snapshots FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Configurações de coleta
CREATE TABLE public.po_collection_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.po_monitored_entities(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- zenscrape, datastream
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_interval_minutes INTEGER DEFAULT 60,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.po_collection_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_configs_select" ON public.po_collection_configs FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "po_configs_modify" ON public.po_collection_configs FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Índices para performance
CREATE INDEX idx_po_mentions_entity ON public.po_mentions(entity_id);
CREATE INDEX idx_po_mentions_source ON public.po_mentions(source);
CREATE INDEX idx_po_mentions_published ON public.po_mentions(published_at DESC);
CREATE INDEX idx_po_sentiment_entity ON public.po_sentiment_analyses(entity_id);
CREATE INDEX idx_po_sentiment_sentiment ON public.po_sentiment_analyses(sentiment);
CREATE INDEX idx_po_sentiment_category ON public.po_sentiment_analyses(category);
CREATE INDEX idx_po_snapshots_date ON public.po_daily_snapshots(snapshot_date DESC);
CREATE INDEX idx_po_events_entity ON public.po_events(entity_id);
CREATE INDEX idx_po_events_data ON public.po_events(data_evento DESC);
