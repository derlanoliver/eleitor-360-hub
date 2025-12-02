-- Tabela para rastrear visualizações de página por contato
CREATE TABLE public.contact_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.office_contacts(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL, -- 'evento', 'captacao', 'affiliate'
  page_identifier TEXT NOT NULL, -- slug do evento/funil
  page_name TEXT, -- nome amigável da página
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para rastrear downloads de materiais por contato
CREATE TABLE public.contact_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.office_contacts(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.lead_funnels(id) ON DELETE SET NULL,
  funnel_name TEXT NOT NULL,
  lead_magnet_nome TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_contact_page_views_contact_id ON public.contact_page_views(contact_id);
CREATE INDEX idx_contact_page_views_created_at ON public.contact_page_views(created_at DESC);
CREATE INDEX idx_contact_downloads_contact_id ON public.contact_downloads(contact_id);
CREATE INDEX idx_contact_downloads_downloaded_at ON public.contact_downloads(downloaded_at DESC);

-- Habilitar RLS
ALTER TABLE public.contact_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_downloads ENABLE ROW LEVEL SECURITY;

-- Policies para contact_page_views
CREATE POLICY "contact_page_views_select_auth" ON public.contact_page_views
FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente')
);

CREATE POLICY "contact_page_views_insert_public" ON public.contact_page_views
FOR INSERT WITH CHECK (true);

-- Policies para contact_downloads
CREATE POLICY "contact_downloads_select_auth" ON public.contact_downloads
FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente')
);

CREATE POLICY "contact_downloads_insert_public" ON public.contact_downloads
FOR INSERT WITH CHECK (true);