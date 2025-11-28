-- Fase 1: Adicionar campos necessários

-- 1.1 Adicionar campo email em office_contacts
ALTER TABLE office_contacts ADD COLUMN IF NOT EXISTS email text;
CREATE INDEX IF NOT EXISTS idx_office_contacts_email ON office_contacts(email) WHERE email IS NOT NULL;

-- 1.2 Adicionar campo contact_id em event_registrations
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES office_contacts(id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_contact_id ON event_registrations(contact_id);

-- 1.3 Criar função para normalizar telefone no formato E.164
CREATE OR REPLACE FUNCTION normalize_phone_e164(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  clean_phone text;
  normalized text;
BEGIN
  -- Remove todos os caracteres não numéricos
  clean_phone := regexp_replace(phone, '[^0-9]', '', 'g');
  
  -- Se já tem +55, remove para processar
  IF clean_phone LIKE '55%' THEN
    clean_phone := substring(clean_phone from 3);
  END IF;
  
  -- Corrige erros comuns do formato 5506
  IF length(clean_phone) = 12 AND substring(clean_phone from 1 for 4) = '5506' THEN
    clean_phone := '61' || substring(clean_phone from 5);
  END IF;
  
  -- Adiciona 9 se faltando (Brasília)
  IF length(clean_phone) = 10 AND substring(clean_phone from 1 for 2) = '61' THEN
    clean_phone := '61' || '9' || substring(clean_phone from 3);
  END IF;
  
  -- Adiciona DDD 61 se for só o número
  IF length(clean_phone) = 9 THEN
    clean_phone := '61' || clean_phone;
  ELSIF length(clean_phone) = 8 THEN
    clean_phone := '61' || '9' || clean_phone;
  END IF;
  
  -- Retorna no formato E.164
  IF length(clean_phone) = 11 THEN
    RETURN '+55' || clean_phone;
  END IF;
  
  -- Se não conseguiu normalizar, retorna o original com +55
  RETURN '+55' || clean_phone;
END;
$$;

-- 1.4 Criar função para sincronizar contatos ao criar inscrição
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
BEGIN
  -- Normalizar WhatsApp
  _normalized_phone := normalize_phone_e164(NEW.whatsapp);
  
  -- Usar cidade_id da inscrição ou NULL
  _cidade_id := NEW.cidade_id;
  
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
      'evento',
      NEW.event_id,
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

-- 1.5 Criar trigger BEFORE INSERT em event_registrations
DROP TRIGGER IF EXISTS sync_event_registration_contact_trigger ON event_registrations;
CREATE TRIGGER sync_event_registration_contact_trigger
  BEFORE INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_registration_contact();

-- Fase 4: Migrar dados existentes
-- Vincular inscrições existentes aos contatos
UPDATE event_registrations er
SET contact_id = oc.id
FROM office_contacts oc
WHERE er.contact_id IS NULL
  AND (
    oc.telefone_norm = normalize_phone_e164(er.whatsapp)
    OR (oc.email IS NOT NULL AND oc.email = er.email)
  );