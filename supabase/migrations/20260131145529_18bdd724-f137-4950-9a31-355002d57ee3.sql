-- Atualizar RPC para usar prazo ANTES do evento (subtração ao invés de adição)
CREATE OR REPLACE FUNCTION create_event_registration(
  _event_id uuid,
  _nome text,
  _email text,
  _whatsapp text,
  _endereco text DEFAULT NULL,
  _data_nascimento text DEFAULT NULL,
  _leader_token text DEFAULT NULL,
  _cidade_id uuid DEFAULT NULL,
  _utm_source text DEFAULT NULL,
  _utm_medium text DEFAULT NULL,
  _utm_campaign text DEFAULT NULL,
  _utm_content text DEFAULT NULL
)
RETURNS TABLE(
  registration_id uuid,
  qr_code text,
  is_new boolean,
  contact_id uuid
) AS $$
DECLARE
  _leader_id uuid := NULL;
  _contact_id uuid := NULL;
  _registration_id uuid;
  _qr_code text;
  _is_new boolean := false;
  _event_datetime timestamp with time zone;
  _deadline timestamp with time zone;
  _deadline_hours integer;
BEGIN
  -- Buscar evento e calcular deadline
  SELECT 
    (e.date || ' ' || e.time)::timestamp with time zone,
    e.registration_deadline_hours
  INTO _event_datetime, _deadline_hours
  FROM events e
  WHERE e.id = _event_id AND e.status = 'active';

  IF _event_datetime IS NULL THEN
    RAISE EXCEPTION 'Evento não encontrado ou inativo.';
  END IF;

  -- Verificar prazo (agora é ANTES do evento, não depois)
  IF _deadline_hours IS NOT NULL THEN
    _deadline := _event_datetime - (_deadline_hours || ' hours')::interval;
    IF now() > _deadline THEN
      RAISE EXCEPTION 'O prazo para inscrições neste evento foi encerrado.';
    END IF;
  END IF;

  -- Buscar líder pelo token se fornecido
  IF _leader_token IS NOT NULL AND _leader_token != '' THEN
    SELECT id INTO _leader_id FROM lideres WHERE affiliate_token = _leader_token AND is_active = true;
  END IF;

  -- Verificar se já existe inscrição com mesmo email ou whatsapp
  SELECT id, qr_code INTO _registration_id, _qr_code
  FROM event_registrations
  WHERE event_id = _event_id AND (email = _email OR whatsapp = _whatsapp)
  LIMIT 1;

  IF _registration_id IS NOT NULL THEN
    -- Retornar inscrição existente
    RETURN QUERY SELECT _registration_id, _qr_code, false, _contact_id;
    RETURN;
  END IF;

  -- Gerar QR code único
  _qr_code := encode(gen_random_bytes(16), 'hex');

  -- Criar nova inscrição
  INSERT INTO event_registrations (
    event_id, nome, email, whatsapp, endereco, data_nascimento,
    leader_id, cidade_id, qr_code,
    utm_source, utm_medium, utm_campaign, utm_content
  ) VALUES (
    _event_id, _nome, _email, _whatsapp, _endereco, _data_nascimento,
    _leader_id, _cidade_id, _qr_code,
    _utm_source, _utm_medium, _utm_campaign, _utm_content
  ) RETURNING id INTO _registration_id;

  _is_new := true;

  RETURN QUERY SELECT _registration_id, _qr_code, _is_new, _contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;