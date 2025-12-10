-- Atualizar função create_event_registration para bloquear inscrições 4h após o evento
CREATE OR REPLACE FUNCTION public.create_event_registration(
  _event_id uuid, 
  _nome text, 
  _email text, 
  _whatsapp text, 
  _cidade_id uuid DEFAULT NULL::uuid, 
  _leader_id uuid DEFAULT NULL::uuid, 
  _utm_source text DEFAULT NULL::text, 
  _utm_medium text DEFAULT NULL::text, 
  _utm_campaign text DEFAULT NULL::text, 
  _utm_content text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, qr_code text, checked_in boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _registration_id uuid;
  _registration_qr_code text;
  _event_datetime timestamp with time zone;
  _deadline timestamp with time zone;
BEGIN
  -- Verificar se o evento existe e está ativo
  SELECT (e.date + e.time)::timestamp with time zone
  INTO _event_datetime
  FROM events e
  WHERE e.id = _event_id AND e.status = 'active';
  
  IF _event_datetime IS NULL THEN
    RAISE EXCEPTION 'Evento não encontrado ou não está ativo.';
  END IF;
  
  -- Verificar se já passou 4 horas do horário do evento
  _deadline := _event_datetime + interval '4 hours';
  IF now() > _deadline THEN
    RAISE EXCEPTION 'O prazo para inscrições neste evento foi encerrado.';
  END IF;

  -- Check for existing registration
  IF EXISTS (
    SELECT 1 FROM event_registrations 
    WHERE event_id = _event_id AND email = _email
  ) THEN
    RAISE EXCEPTION 'Você já está inscrito neste evento!';
  END IF;

  -- Insert registration (triggers will handle QR code and contact sync)
  INSERT INTO event_registrations (
    event_id, nome, email, whatsapp, cidade_id, leader_id,
    utm_source, utm_medium, utm_campaign, utm_content
  ) VALUES (
    _event_id, _nome, _email, _whatsapp, _cidade_id, _leader_id,
    _utm_source, _utm_medium, _utm_campaign, _utm_content
  )
  RETURNING event_registrations.id, event_registrations.qr_code 
  INTO _registration_id, _registration_qr_code;

  RETURN QUERY SELECT _registration_id, _registration_qr_code, false;
END;
$function$;