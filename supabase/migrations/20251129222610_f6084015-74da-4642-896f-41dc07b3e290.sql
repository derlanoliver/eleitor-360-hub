-- Criar tabela page_views para rastreamento de visitantes
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  page_identifier TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index para buscar por campanha
CREATE INDEX idx_page_views_utm_campaign ON page_views(utm_campaign);
CREATE INDEX idx_page_views_session ON page_views(session_id);

-- RLS: qualquer um pode inserir (é público)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_views_insert_public 
  ON page_views 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY page_views_select_admin 
  ON page_views 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Função que incrementa total_cadastros quando alguém se cadastra com utm_campaign via event_registrations
CREATE OR REPLACE FUNCTION increment_campaign_from_event_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.utm_campaign IS NOT NULL THEN
    UPDATE campaigns
    SET total_cadastros = total_cadastros + 1,
        updated_at = now()
    WHERE utm_campaign = NEW.utm_campaign;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger na tabela event_registrations
CREATE TRIGGER trigger_increment_campaign_from_event
  AFTER INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION increment_campaign_from_event_registration();