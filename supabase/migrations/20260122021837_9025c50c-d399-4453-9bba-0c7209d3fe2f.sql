-- Adicionar coluna data_nascimento na tabela event_registrations
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS data_nascimento date;

-- Atualizar função RPC para incluir data_nascimento
CREATE OR REPLACE FUNCTION public.create_event_registration(
  _event_id uuid, 
  _nome text, 
  _email text, 
  _whatsapp text, 
  _cidade_id uuid DEFAULT NULL,
  _leader_id uuid DEFAULT NULL,
  _utm_source text DEFAULT NULL,
  _utm_medium text DEFAULT NULL,
  _utm_campaign text DEFAULT NULL,
  _utm_content text DEFAULT NULL,
  _data_nascimento date DEFAULT NULL
)
RETURNS TABLE(id uuid, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
  _created_at timestamptz;
BEGIN
  INSERT INTO event_registrations (
    event_id, 
    nome, 
    email, 
    whatsapp, 
    cidade_id, 
    leader_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    data_nascimento
  )
  VALUES (
    _event_id, 
    _nome, 
    _email, 
    _whatsapp, 
    _cidade_id, 
    _leader_id,
    _utm_source,
    _utm_medium,
    _utm_campaign,
    _utm_content,
    _data_nascimento
  )
  RETURNING event_registrations.id, event_registrations.created_at INTO _new_id, _created_at;
  
  RETURN QUERY SELECT _new_id, _created_at;
END;
$$;

-- Atualizar trigger para sincronizar data_nascimento com office_contacts
CREATE OR REPLACE FUNCTION sync_event_registration_contact()
RETURNS TRIGGER AS $$
DECLARE
  normalized_phone text;
  existing_contact_id uuid;
  event_org_id uuid;
BEGIN
  -- Normalizar telefone para formato E.164
  normalized_phone := regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g');
  IF length(normalized_phone) = 11 THEN
    normalized_phone := '+55' || normalized_phone;
  ELSIF length(normalized_phone) = 10 THEN
    normalized_phone := '+55' || normalized_phone;
  ELSIF NOT normalized_phone LIKE '+%' THEN
    normalized_phone := '+' || normalized_phone;
  END IF;

  -- Obter organization_id do evento
  SELECT organization_id INTO event_org_id FROM events WHERE id = NEW.event_id;

  -- Verificar se já existe contato com este telefone
  SELECT id INTO existing_contact_id 
  FROM office_contacts 
  WHERE telefone = normalized_phone
  LIMIT 1;

  IF existing_contact_id IS NOT NULL THEN
    -- Atualizar contato existente (preencher campos vazios)
    UPDATE office_contacts SET
      nome = COALESCE(NULLIF(nome, ''), NEW.nome),
      email = COALESCE(NULLIF(email, ''), NEW.email),
      cidade_id = COALESCE(cidade_id, NEW.cidade_id),
      data_nascimento = COALESCE(data_nascimento, NEW.data_nascimento),
      updated_at = now()
    WHERE id = existing_contact_id;
    
    -- Atualizar registration com contact_id
    NEW.contact_id := existing_contact_id;
  ELSE
    -- Criar novo contato
    INSERT INTO office_contacts (
      nome, 
      email, 
      telefone, 
      cidade_id, 
      source_type, 
      source_id,
      organization_id,
      data_nascimento
    )
    VALUES (
      NEW.nome, 
      NEW.email, 
      normalized_phone, 
      NEW.cidade_id, 
      'event_registration', 
      NEW.id,
      event_org_id,
      NEW.data_nascimento
    )
    RETURNING id INTO existing_contact_id;
    
    NEW.contact_id := existing_contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;