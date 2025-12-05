-- Fix sync_event_registration_contact to be SECURITY DEFINER
-- This allows the trigger to access office_contacts table even when called by anonymous users
CREATE OR REPLACE FUNCTION public.sync_event_registration_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;