-- =====================================================
-- FASE 1: CRIAR TABELA CAMPAIGNS
-- =====================================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  utm_source TEXT NOT NULL,
  utm_medium TEXT,
  utm_campaign TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  total_cadastros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(utm_source, utm_medium, utm_campaign)
);

-- Trigger para updated_at
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select ON campaigns
  FOR SELECT USING (true);

CREATE POLICY campaigns_modify ON campaigns
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FASE 2: ADICIONAR CAMPOS DE ORIGEM EM OFFICE_CONTACTS
-- =====================================================

ALTER TABLE office_contacts
  ADD COLUMN source_type TEXT CHECK (source_type IN ('lider', 'campanha', 'evento', 'afiliado', 'manual')),
  ADD COLUMN source_id UUID,
  ADD COLUMN utm_source TEXT,
  ADD COLUMN utm_medium TEXT,
  ADD COLUMN utm_campaign TEXT,
  ADD COLUMN utm_content TEXT;

CREATE INDEX idx_contacts_source ON office_contacts(source_type, source_id);
CREATE INDEX idx_contacts_utm ON office_contacts(utm_source, utm_campaign);

-- =====================================================
-- FASE 3: FUNÇÃO E TRIGGER PARA ATUALIZAR CADASTROS DO LÍDER
-- =====================================================

CREATE OR REPLACE FUNCTION update_leader_cadastros()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source_type = 'lider' AND NEW.source_id IS NOT NULL THEN
    UPDATE lideres
    SET cadastros = cadastros + 1,
        last_activity = now()
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER contact_update_leader_cadastros
  AFTER INSERT ON office_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_leader_cadastros();

-- =====================================================
-- FASE 4: FUNÇÃO E TRIGGER PARA ATUALIZAR CADASTROS DA CAMPANHA
-- =====================================================

CREATE OR REPLACE FUNCTION update_campaign_cadastros()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source_type = 'campanha' AND NEW.source_id IS NOT NULL THEN
    UPDATE campaigns
    SET total_cadastros = total_cadastros + 1,
        updated_at = now()
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER contact_update_campaign_cadastros
  AFTER INSERT ON office_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_cadastros();

-- =====================================================
-- FASE 5: INSERIR CAMPANHA "ELEITORES META - 2025"
-- =====================================================

INSERT INTO campaigns (
  nome,
  descricao,
  utm_source,
  utm_medium,
  utm_campaign,
  status
) VALUES (
  'Eleitores Meta - 2025',
  'Campanha de tráfego pago no Facebook para captação de eleitores',
  'facebook',
  'paid',
  'eleitores_meta_2025',
  'active'
);