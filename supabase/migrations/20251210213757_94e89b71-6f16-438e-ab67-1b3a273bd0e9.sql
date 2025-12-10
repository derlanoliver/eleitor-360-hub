-- Atualizar função checkin_event_by_qr para bloquear check-ins 4h após o evento
CREATE OR REPLACE FUNCTION public.checkin_event_by_qr(_qr_code text, _checked_in boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _registration_id uuid;
  _event_datetime timestamp with time zone;
  _deadline timestamp with time zone;
BEGIN
  -- Buscar a inscrição e dados do evento pelo QR code
  SELECT er.id, (e.date + e.time)::timestamp with time zone
  INTO _registration_id, _event_datetime
  FROM event_registrations er
  JOIN events e ON e.id = er.event_id
  WHERE er.qr_code = _qr_code;
  
  IF _registration_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se já passou 4 horas do horário do evento (só para check-in, não para desfazer)
  IF _checked_in = true THEN
    _deadline := _event_datetime + interval '4 hours';
    IF now() > _deadline THEN
      RAISE EXCEPTION 'O período de check-in para este evento foi encerrado.';
    END IF;
  END IF;
  
  -- Atualizar a inscrição
  UPDATE event_registrations
  SET 
    checked_in = _checked_in,
    checked_in_at = CASE WHEN _checked_in THEN now() ELSE NULL END
  WHERE id = _registration_id;
  
  RETURN true;
END;
$function$;