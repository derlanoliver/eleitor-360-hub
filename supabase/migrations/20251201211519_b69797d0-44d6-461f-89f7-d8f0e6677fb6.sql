-- Create lead_funnels table for lead capture system
CREATE TABLE public.lead_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic info
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused
  
  -- Lead magnet
  lead_magnet_nome TEXT NOT NULL,
  lead_magnet_url TEXT NOT NULL,
  
  -- Landing page customization
  cover_url TEXT,
  logo_url TEXT,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  texto_botao TEXT NOT NULL DEFAULT 'Quero Receber',
  cor_botao TEXT DEFAULT '#10b981', -- emerald-500
  campos_form JSONB NOT NULL DEFAULT '["nome", "email", "whatsapp"]'::jsonb,
  
  -- Thank you page customization
  obrigado_titulo TEXT NOT NULL DEFAULT 'Parabéns! Seu material está pronto.',
  obrigado_subtitulo TEXT,
  obrigado_texto_botao TEXT NOT NULL DEFAULT 'Baixar Agora',
  cta_adicional_texto TEXT,
  cta_adicional_url TEXT,
  
  -- Metrics
  views_count INTEGER NOT NULL DEFAULT 0,
  leads_count INTEGER NOT NULL DEFAULT 0,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_funnels ENABLE ROW LEVEL SECURITY;

-- Public can view active funnels (for landing pages)
CREATE POLICY "lead_funnels_select_public" 
ON public.lead_funnels 
FOR SELECT 
USING (status = 'active');

-- Admins can view all funnels
CREATE POLICY "lead_funnels_select_admin" 
ON public.lead_funnels 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can modify funnels
CREATE POLICY "lead_funnels_modify" 
ON public.lead_funnels 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for funnel assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-funnel-assets', 'lead-funnel-assets', true);

-- Storage policies for funnel assets
CREATE POLICY "lead_funnel_assets_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'lead-funnel-assets');

CREATE POLICY "lead_funnel_assets_admin_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lead-funnel-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "lead_funnel_assets_admin_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lead-funnel-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "lead_funnel_assets_admin_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'lead-funnel-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_lead_funnels_updated_at
BEFORE UPDATE ON public.lead_funnels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_funnel_slug(base_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slug TEXT;
  _counter INTEGER := 0;
  _exists BOOLEAN;
BEGIN
  -- Create base slug from name
  _slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  _slug := trim(both '-' from _slug);
  
  -- Check if exists and append counter if needed
  LOOP
    IF _counter = 0 THEN
      SELECT EXISTS(SELECT 1 FROM lead_funnels WHERE slug = _slug) INTO _exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM lead_funnels WHERE slug = _slug || '-' || _counter) INTO _exists;
    END IF;
    
    EXIT WHEN NOT _exists;
    _counter := _counter + 1;
  END LOOP;
  
  IF _counter > 0 THEN
    _slug := _slug || '-' || _counter;
  END IF;
  
  RETURN _slug;
END;
$$;

-- Function to increment funnel metrics
CREATE OR REPLACE FUNCTION public.increment_funnel_metric(
  _funnel_id UUID,
  _metric TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _metric = 'views' THEN
    UPDATE lead_funnels SET views_count = views_count + 1 WHERE id = _funnel_id;
  ELSIF _metric = 'leads' THEN
    UPDATE lead_funnels SET leads_count = leads_count + 1 WHERE id = _funnel_id;
  ELSIF _metric = 'downloads' THEN
    UPDATE lead_funnels SET downloads_count = downloads_count + 1 WHERE id = _funnel_id;
  END IF;
END;
$$;