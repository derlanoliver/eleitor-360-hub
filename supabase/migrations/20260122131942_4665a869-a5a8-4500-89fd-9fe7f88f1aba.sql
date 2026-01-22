-- Add endereco column to event_registrations table
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS endereco text;

-- Update the create_event_registration RPC to accept endereco parameter
CREATE OR REPLACE FUNCTION create_event_registration(
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
  _data_nascimento date DEFAULT NULL,
  _endereco text DEFAULT NULL
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
    event_id, nome, email, whatsapp, cidade_id, leader_id,
    utm_source, utm_medium, utm_campaign, utm_content,
    data_nascimento, endereco
  )
  VALUES (
    _event_id, _nome, _email, _whatsapp, _cidade_id, _leader_id,
    _utm_source, _utm_medium, _utm_campaign, _utm_content,
    _data_nascimento, _endereco
  )
  RETURNING event_registrations.id, event_registrations.created_at 
  INTO _new_id, _created_at;
  
  RETURN QUERY SELECT _new_id, _created_at;
END;
$$;

-- Update the sync trigger to include endereco
CREATE OR REPLACE FUNCTION sync_event_registration_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_phone text;
  existing_contact_id uuid;
  event_org_id uuid;
BEGIN
  -- Normalize phone number to E.164 format
  normalized_phone := regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g');
  IF length(normalized_phone) = 11 THEN
    normalized_phone := '+55' || normalized_phone;
  ELSIF length(normalized_phone) = 10 THEN
    normalized_phone := '+55' || normalized_phone;
  ELSIF length(normalized_phone) = 13 AND normalized_phone LIKE '55%' THEN
    normalized_phone := '+' || normalized_phone;
  ELSIF length(normalized_phone) > 0 AND normalized_phone NOT LIKE '+%' THEN
    normalized_phone := '+' || normalized_phone;
  END IF;

  -- Get organization_id from event
  SELECT organization_id INTO event_org_id
  FROM events
  WHERE id = NEW.event_id;

  -- Check if contact already exists by phone
  SELECT id INTO existing_contact_id
  FROM office_contacts
  WHERE telefone = normalized_phone
  LIMIT 1;

  IF existing_contact_id IS NOT NULL THEN
    -- Update existing contact with new data (only if current value is empty)
    UPDATE office_contacts SET
      nome = COALESCE(NULLIF(nome, ''), NEW.nome),
      email = COALESCE(NULLIF(email, ''), NEW.email),
      cidade_id = COALESCE(cidade_id, NEW.cidade_id),
      data_nascimento = COALESCE(data_nascimento, NEW.data_nascimento),
      endereco = COALESCE(NULLIF(endereco, ''), NEW.endereco),
      updated_at = now()
    WHERE id = existing_contact_id;
    
    NEW.contact_id := existing_contact_id;
  ELSE
    -- Create new contact
    INSERT INTO office_contacts (
      nome, email, telefone, cidade_id, source_type, source_id,
      organization_id, data_nascimento, endereco
    )
    VALUES (
      NEW.nome, NEW.email, normalized_phone, NEW.cidade_id, 
      'event_registration', NEW.id, event_org_id, 
      NEW.data_nascimento, NEW.endereco
    )
    RETURNING id INTO existing_contact_id;
    
    NEW.contact_id := existing_contact_id;
  END IF;

  RETURN NEW;
END;
$$;