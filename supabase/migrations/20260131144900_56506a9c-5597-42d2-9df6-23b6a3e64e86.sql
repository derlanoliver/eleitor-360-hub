-- Adicionar coluna de prazo de inscrição (em horas, NULL = sem limite)
ALTER TABLE events ADD COLUMN registration_deadline_hours integer DEFAULT 4;

-- Atualizar função RPC para usar prazo configurável do evento
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
RETURNS TABLE(id uuid, created_at timestamptz, qr_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
  _created_at timestamptz;
  _qr_code text;
  _normalized_phone text;
  _event_datetime timestamp with time zone;
  _deadline timestamp with time zone;
  _deadline_hours integer;
BEGIN
  -- 1. Verificar se o evento existe e está ativo, e buscar prazo configurado
  SELECT (e.date + e.time)::timestamp with time zone, e.registration_deadline_hours
  INTO _event_datetime, _deadline_hours
  FROM events e
  WHERE e.id = _event_id AND e.status = 'active';
  
  IF _event_datetime IS NULL THEN
    RAISE EXCEPTION 'Evento não encontrado ou não está ativo.';
  END IF;
  
  -- 2. Verificar prazo se configurado (NULL = sem limite)
  IF _deadline_hours IS NOT NULL THEN
    _deadline := _event_datetime + (_deadline_hours || ' hours')::interval;
    IF now() > _deadline THEN
      RAISE EXCEPTION 'O prazo para inscrições neste evento foi encerrado.';
    END IF;
  END IF;

  -- 3. Normalizar telefone para comparação (apenas dígitos)
  _normalized_phone := regexp_replace(_whatsapp, '[^0-9]', '', 'g');
  
  -- 4. Verificar se já existe inscrição por email OU telefone neste evento
  IF EXISTS (
    SELECT 1 FROM event_registrations er
    WHERE er.event_id = _event_id 
    AND (
      lower(er.email) = lower(_email) 
      OR regexp_replace(er.whatsapp, '[^0-9]', '', 'g') = _normalized_phone
    )
  ) THEN
    RAISE EXCEPTION 'Você já está inscrito neste evento.';
  END IF;

  -- 5. Inserir registro (trigger gera qr_code automaticamente)
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
  RETURNING event_registrations.id, event_registrations.created_at, event_registrations.qr_code
  INTO _new_id, _created_at, _qr_code;
  
  RETURN QUERY SELECT _new_id, _created_at, _qr_code;
END;
$$;