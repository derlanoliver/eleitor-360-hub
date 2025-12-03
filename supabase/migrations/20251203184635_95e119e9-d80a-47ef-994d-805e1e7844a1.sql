
-- =====================================================
-- FASE 1: Preparação do Banco de Dados
-- =====================================================

-- 1.1 Remover downloads duplicados mantendo apenas o primeiro
DELETE FROM contact_downloads a
USING contact_downloads b
WHERE a.id > b.id
  AND a.contact_id = b.contact_id
  AND a.funnel_id = b.funnel_id;

-- 1.2 Criar constraint única para evitar downloads duplicados
ALTER TABLE contact_downloads 
ADD CONSTRAINT unique_contact_funnel_download 
UNIQUE (contact_id, funnel_id);

-- 1.3 Remover triggers antigos de pontuação
DROP TRIGGER IF EXISTS update_leader_score_on_visit ON office_visits;
DROP TRIGGER IF EXISTS increment_leader_from_event_trigger ON event_registrations;
DROP TRIGGER IF EXISTS update_leader_cadastros_trigger ON office_contacts;
DROP TRIGGER IF EXISTS sync_leader_registrations_trigger ON office_contacts;

-- 1.4 Criar função para verificar se contato é líder
CREATE OR REPLACE FUNCTION get_leader_by_phone_or_email(
  _phone TEXT,
  _email TEXT
)
RETURNS UUID AS $$
DECLARE
  _leader_id UUID;
BEGIN
  SELECT id INTO _leader_id
  FROM lideres
  WHERE is_active = true
    AND (
      (telefone IS NOT NULL AND normalize_phone_e164(telefone) = normalize_phone_e164(_phone))
      OR (email IS NOT NULL AND email = _email)
    )
  LIMIT 1;
  
  RETURN _leader_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FASE 2: Função Centralizada de Pontuação
-- =====================================================

CREATE OR REPLACE FUNCTION award_leader_points(
  _leader_id UUID,
  _points INTEGER,
  _reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF _leader_id IS NULL OR _points = 0 THEN
    RETURN;
  END IF;
  
  UPDATE lideres
  SET pontuacao_total = pontuacao_total + _points,
      last_activity = now()
  WHERE id = _leader_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_leader_cadastros(
  _leader_id UUID
)
RETURNS VOID AS $$
BEGIN
  IF _leader_id IS NULL THEN
    RETURN;
  END IF;
  
  UPDATE lideres
  SET cadastros = cadastros + 1,
      last_activity = now()
  WHERE id = _leader_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FASE 3: Novos Triggers de Pontuação
-- =====================================================

-- 3.1 Trigger: Cadastro de Contato via Indicação (+1 ponto, +1 cadastro)
CREATE OR REPLACE FUNCTION score_contact_indication()
RETURNS TRIGGER AS $$
DECLARE
  _registrant_leader_id UUID;
BEGIN
  -- Se foi indicado por um líder: +1 ponto e +1 cadastro para o líder
  IF NEW.source_type = 'lider' AND NEW.source_id IS NOT NULL THEN
    PERFORM award_leader_points(NEW.source_id::UUID, 1, 'indicacao_contato');
    PERFORM increment_leader_cadastros(NEW.source_id::UUID);
  END IF;
  
  -- Verificar se o contato que se cadastrou é um líder: +1 ponto para ele
  SELECT id INTO _registrant_leader_id
  FROM lideres
  WHERE is_active = true
    AND (
      (telefone IS NOT NULL AND normalize_phone_e164(telefone) = NEW.telefone_norm)
      OR (email IS NOT NULL AND email = NEW.email)
    )
  LIMIT 1;
  
  IF _registrant_leader_id IS NOT NULL AND (NEW.source_type != 'lider' OR NEW.source_id::UUID != _registrant_leader_id) THEN
    PERFORM award_leader_points(_registrant_leader_id, 1, 'lider_cadastro_proprio');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS score_contact_indication_trigger ON office_contacts;
CREATE TRIGGER score_contact_indication_trigger
AFTER INSERT ON office_contacts
FOR EACH ROW
EXECUTE FUNCTION score_contact_indication();

-- 3.2 Trigger: Inscrição em Evento (+1 ponto por indicação, +1 se for líder)
CREATE OR REPLACE FUNCTION score_event_registration()
RETURNS TRIGGER AS $$
DECLARE
  _registrant_leader_id UUID;
BEGIN
  -- Se foi indicado por um líder via link de afiliado: +1 ponto e +1 cadastro
  IF NEW.leader_id IS NOT NULL THEN
    PERFORM award_leader_points(NEW.leader_id, 1, 'indicacao_evento');
    PERFORM increment_leader_cadastros(NEW.leader_id);
  END IF;
  
  -- Verificar se o inscrito é um líder: +1 ponto para ele mesmo
  SELECT id INTO _registrant_leader_id
  FROM lideres
  WHERE is_active = true
    AND (
      (telefone IS NOT NULL AND normalize_phone_e164(telefone) = normalize_phone_e164(NEW.whatsapp))
      OR (email IS NOT NULL AND email = NEW.email)
    )
  LIMIT 1;
  
  -- Líder ganha +1 ponto por se inscrever (mesmo que via link de outro líder)
  IF _registrant_leader_id IS NOT NULL THEN
    PERFORM award_leader_points(_registrant_leader_id, 1, 'lider_inscricao_evento');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS score_event_registration_trigger ON event_registrations;
CREATE TRIGGER score_event_registration_trigger
AFTER INSERT ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION score_event_registration();

-- 3.3 Trigger: Check-in em Evento (+2 pontos)
CREATE OR REPLACE FUNCTION score_event_checkin()
RETURNS TRIGGER AS $$
DECLARE
  _registrant_leader_id UUID;
BEGIN
  -- Só pontua quando checked_in muda de false/null para true
  IF NEW.checked_in = true AND (OLD.checked_in IS NULL OR OLD.checked_in = false) THEN
    -- Se foi indicado: +2 pontos para o líder que indicou
    IF NEW.leader_id IS NOT NULL THEN
      PERFORM award_leader_points(NEW.leader_id, 2, 'checkin_evento_indicado');
    END IF;
    
    -- Verificar se o inscrito é um líder: +2 pontos para ele mesmo
    SELECT id INTO _registrant_leader_id
    FROM lideres
    WHERE is_active = true
      AND (
        (telefone IS NOT NULL AND normalize_phone_e164(telefone) = normalize_phone_e164(NEW.whatsapp))
        OR (email IS NOT NULL AND email = NEW.email)
      )
    LIMIT 1;
    
    IF _registrant_leader_id IS NOT NULL THEN
      PERFORM award_leader_points(_registrant_leader_id, 2, 'lider_checkin_evento');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS score_event_checkin_trigger ON event_registrations;
CREATE TRIGGER score_event_checkin_trigger
AFTER UPDATE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION score_event_checkin();

-- 3.4 Trigger: Check-in em Visita ao Gabinete (+2 pontos - somente indicados)
CREATE OR REPLACE FUNCTION score_visit_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- Só pontua quando checked_in muda de false/null para true
  IF NEW.checked_in = true AND (OLD.checked_in IS NULL OR OLD.checked_in = false) THEN
    -- Somente visitas indicadas por líder: +2 pontos
    IF NEW.leader_id IS NOT NULL THEN
      PERFORM award_leader_points(NEW.leader_id, 2, 'checkin_visita_indicada');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS score_visit_checkin_trigger ON office_visits;
CREATE TRIGGER score_visit_checkin_trigger
AFTER UPDATE ON office_visits
FOR EACH ROW
EXECUTE FUNCTION score_visit_checkin();

-- 3.5 Trigger: Download de Material (+2 pontos - primeira vez)
CREATE OR REPLACE FUNCTION score_material_download()
RETURNS TRIGGER AS $$
DECLARE
  _contact_record RECORD;
  _downloader_leader_id UUID;
BEGIN
  -- Buscar informações do contato
  SELECT * INTO _contact_record
  FROM office_contacts
  WHERE id = NEW.contact_id;
  
  IF _contact_record IS NOT NULL THEN
    -- Se o contato foi indicado por um líder: +2 pontos para o líder
    IF _contact_record.source_type = 'lider' AND _contact_record.source_id IS NOT NULL THEN
      PERFORM award_leader_points(_contact_record.source_id::UUID, 2, 'download_material_indicado');
    END IF;
    
    -- Verificar se quem baixou é um líder: +2 pontos para ele mesmo
    SELECT id INTO _downloader_leader_id
    FROM lideres
    WHERE is_active = true
      AND (
        (telefone IS NOT NULL AND normalize_phone_e164(telefone) = _contact_record.telefone_norm)
        OR (email IS NOT NULL AND email = _contact_record.email)
      )
    LIMIT 1;
    
    IF _downloader_leader_id IS NOT NULL AND (
      _contact_record.source_type != 'lider' 
      OR _contact_record.source_id IS NULL 
      OR _contact_record.source_id::UUID != _downloader_leader_id
    ) THEN
      PERFORM award_leader_points(_downloader_leader_id, 2, 'lider_download_material');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS score_material_download_trigger ON contact_downloads;
CREATE TRIGGER score_material_download_trigger
AFTER INSERT ON contact_downloads
FOR EACH ROW
EXECUTE FUNCTION score_material_download();
