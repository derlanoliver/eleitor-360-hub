
-- 1. Recuperar dados perdidos dos líderes a partir das event_registrations
UPDATE lideres l
SET 
  email = COALESCE(l.email, (
    SELECT er.email 
    FROM event_registrations er 
    WHERE normalize_phone_e164(er.whatsapp) = l.telefone 
      AND er.email IS NOT NULL 
    ORDER BY er.created_at DESC 
    LIMIT 1
  )),
  cidade_id = COALESCE(l.cidade_id, (
    SELECT er.cidade_id 
    FROM event_registrations er 
    WHERE normalize_phone_e164(er.whatsapp) = l.telefone 
      AND er.cidade_id IS NOT NULL 
    ORDER BY er.created_at DESC 
    LIMIT 1
  )),
  updated_at = now()
WHERE l.is_active = true
  AND (l.email IS NULL OR l.cidade_id IS NULL);

-- 2. Atualizar trigger para enriquecer dados de líderes em futuros registros
CREATE OR REPLACE FUNCTION public.sync_event_registration_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _contact_id uuid;
  _normalized_phone text;
  _cidade_id uuid;
  _source_type text;
  _source_id uuid;
  _leader_id uuid;
BEGIN
  -- Normalizar WhatsApp
  _normalized_phone := normalize_phone_e164(NEW.whatsapp);
  
  -- Verificar se já é um líder ativo
  SELECT id INTO _leader_id
  FROM lideres 
  WHERE is_active = true
  AND (
    telefone = _normalized_phone
    OR normalize_phone_e164(telefone) = _normalized_phone
    OR (email IS NOT NULL AND LOWER(email) = LOWER(NEW.email))
  )
  LIMIT 1;
  
  -- Se é líder, enriquecer dados faltantes e NÃO criar contato duplicado
  IF _leader_id IS NOT NULL THEN
    -- Atualizar dados faltantes do líder
    UPDATE lideres
    SET 
      email = COALESCE(email, NEW.email),
      cidade_id = COALESCE(cidade_id, NEW.cidade_id),
      updated_at = now()
    WHERE id = _leader_id
      AND (email IS NULL OR cidade_id IS NULL);
    
    -- Vincular o leader_id na inscrição se não estiver definido
    IF NEW.leader_id IS NULL THEN
      NEW.leader_id := _leader_id;
    END IF;
    
    -- Não definir contact_id - líder não precisa de contato
    NEW.contact_id := NULL;
    RETURN NEW;
  END IF;
  
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
