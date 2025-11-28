-- Adicionar coluna leader_id na tabela event_registrations
ALTER TABLE event_registrations ADD COLUMN leader_id uuid REFERENCES lideres(id);

-- Criar índice para melhor performance
CREATE INDEX idx_event_registrations_leader_id ON event_registrations(leader_id);

-- Modificar função sync_event_registration_contact para usar source_type='lider' quando leader_id presente
CREATE OR REPLACE FUNCTION sync_event_registration_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contact_id uuid;
  _normalized_phone text;
  _cidade_id uuid;
  _source_type text;
  _source_id uuid;
BEGIN
  -- Normalizar WhatsApp
  _normalized_phone := normalize_phone_e164(NEW.whatsapp);
  
  -- Usar cidade_id da inscrição ou NULL
  _cidade_id := NEW.cidade_id;
  
  -- Definir source_type e source_id baseado em leader_id
  IF NEW.leader_id IS NOT NULL THEN
    _source_type := 'lider';
    _source_id := NEW.leader_id;
  ELSE
    _source_type := 'evento';
    _source_id := NEW.event_id;
  END IF;
  
  -- Buscar contato existente por telefone normalizado OU email
  SELECT id INTO _contact_id
  FROM office_contacts
  WHERE telefone_norm = _normalized_phone
     OR (email IS NOT NULL AND email = NEW.email)
  LIMIT 1;
  
  IF _contact_id IS NOT NULL THEN
    -- Contato existe: apenas vincular e atualizar email se não existir
    UPDATE office_contacts
    SET email = COALESCE(email, NEW.email),
        updated_at = now()
    WHERE id = _contact_id;
    
    NEW.contact_id := _contact_id;
  ELSE
    -- Contato não existe: criar novo
    INSERT INTO office_contacts (
      nome,
      telefone_norm,
      email,
      cidade_id,
      source_type,
      source_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content
    ) VALUES (
      NEW.nome,
      _normalized_phone,
      NEW.email,
      _cidade_id,
      _source_type,
      _source_id,
      NEW.utm_source,
      NEW.utm_medium,
      NEW.utm_campaign,
      NEW.utm_content
    )
    RETURNING id INTO _contact_id;
    
    NEW.contact_id := _contact_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para incrementar cadastros e pontuação do líder
CREATE OR REPLACE FUNCTION increment_leader_from_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _settings RECORD;
BEGIN
  IF NEW.leader_id IS NOT NULL THEN
    -- Buscar configurações de pontos
    SELECT pontos_form_submitted INTO _settings
    FROM office_settings
    LIMIT 1;
    
    -- Atualizar líder: incrementar cadastros e pontos
    UPDATE lideres
    SET cadastros = cadastros + 1,
        pontuacao_total = pontuacao_total + COALESCE(_settings.pontos_form_submitted, 1),
        last_activity = now()
    WHERE id = NEW.leader_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_leader_from_event_trigger
AFTER INSERT ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION increment_leader_from_event();