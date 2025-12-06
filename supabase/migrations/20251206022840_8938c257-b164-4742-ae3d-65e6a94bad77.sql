-- Atualizar trigger de pontuação de inscrição em eventos para respeitar limite diário
CREATE OR REPLACE FUNCTION public.score_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _registrant_leader_id UUID;
  _contact_verified BOOLEAN;
  _limite_eventos_dia INTEGER;
  _eventos_hoje INTEGER;
  _should_score_leader BOOLEAN := true;
BEGIN
  -- Buscar configuração de limite
  SELECT COALESCE(limite_eventos_dia, 0) INTO _limite_eventos_dia
  FROM office_settings LIMIT 1;
  
  -- Se foi indicado por um líder via link de afiliado
  IF NEW.leader_id IS NOT NULL THEN
    -- Verificar limite diário se configurado (> 0)
    IF _limite_eventos_dia > 0 THEN
      SELECT COUNT(*) INTO _eventos_hoje
      FROM event_registrations
      WHERE leader_id = NEW.leader_id
        AND DATE(created_at) = CURRENT_DATE
        AND id != NEW.id;
      
      -- Se já atingiu o limite, não pontua o líder que indicou
      IF _eventos_hoje >= _limite_eventos_dia THEN
        _should_score_leader := false;
      END IF;
    END IF;
    
    IF _should_score_leader THEN
      -- Buscar status de verificação do contato
      SELECT is_verified INTO _contact_verified
      FROM office_contacts
      WHERE id = NEW.contact_id;
      
      -- Só pontua se verificado ou se não tiver contact_id (contato novo)
      IF _contact_verified = true OR NEW.contact_id IS NULL THEN
        PERFORM award_leader_points(NEW.leader_id, 1, 'indicacao_evento');
        PERFORM increment_leader_cadastros(NEW.leader_id);
      END IF;
    END IF;
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
  -- Também respeitando limite diário
  IF _registrant_leader_id IS NOT NULL THEN
    IF _limite_eventos_dia > 0 THEN
      SELECT COUNT(*) INTO _eventos_hoje
      FROM event_registrations er
      JOIN lideres l ON (
        normalize_phone_e164(l.telefone) = normalize_phone_e164(er.whatsapp)
        OR l.email = er.email
      )
      WHERE l.id = _registrant_leader_id
        AND DATE(er.created_at) = CURRENT_DATE
        AND er.id != NEW.id;
      
      IF _eventos_hoje >= _limite_eventos_dia THEN
        RETURN NEW;
      END IF;
    END IF;
    
    PERFORM award_leader_points(_registrant_leader_id, 1, 'lider_inscricao_evento');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Atualizar trigger de pontuação de check-in para respeitar limite diário
CREATE OR REPLACE FUNCTION public.score_event_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _registrant_leader_id UUID;
  _limite_eventos_dia INTEGER;
  _checkins_hoje INTEGER;
BEGIN
  -- Só pontua quando checked_in muda de false/null para true
  IF NEW.checked_in = true AND (OLD.checked_in IS NULL OR OLD.checked_in = false) THEN
    -- Buscar configuração de limite
    SELECT COALESCE(limite_eventos_dia, 0) INTO _limite_eventos_dia
    FROM office_settings LIMIT 1;
    
    -- Se foi indicado: +2 pontos para o líder que indicou
    IF NEW.leader_id IS NOT NULL THEN
      -- Verificar limite diário se configurado
      IF _limite_eventos_dia > 0 THEN
        SELECT COUNT(*) INTO _checkins_hoje
        FROM event_registrations
        WHERE leader_id = NEW.leader_id
          AND checked_in = true
          AND DATE(checked_in_at) = CURRENT_DATE
          AND id != NEW.id;
        
        IF _checkins_hoje < _limite_eventos_dia THEN
          PERFORM award_leader_points(NEW.leader_id, 2, 'checkin_evento_indicado');
        END IF;
      ELSE
        PERFORM award_leader_points(NEW.leader_id, 2, 'checkin_evento_indicado');
      END IF;
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
      -- Verificar limite diário para o próprio líder
      IF _limite_eventos_dia > 0 THEN
        SELECT COUNT(*) INTO _checkins_hoje
        FROM event_registrations er
        JOIN lideres l ON (
          normalize_phone_e164(l.telefone) = normalize_phone_e164(er.whatsapp)
          OR l.email = er.email
        )
        WHERE l.id = _registrant_leader_id
          AND er.checked_in = true
          AND DATE(er.checked_in_at) = CURRENT_DATE
          AND er.id != NEW.id;
        
        IF _checkins_hoje < _limite_eventos_dia THEN
          PERFORM award_leader_points(_registrant_leader_id, 2, 'lider_checkin_evento');
        END IF;
      ELSE
        PERFORM award_leader_points(_registrant_leader_id, 2, 'lider_checkin_evento');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;