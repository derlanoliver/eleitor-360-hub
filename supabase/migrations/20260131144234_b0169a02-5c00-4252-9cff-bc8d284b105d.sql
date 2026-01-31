-- Restaurar validação de prazo de 4 horas na função create_event_registration
-- Esta migração corrige a regressão introduzida nas migrações 20260122131942 e 20260123123242
-- que removeram acidentalmente a validação de prazo

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
BEGIN
  -- 1. Verificar se o evento existe e está ativo
  SELECT (e.date + e.time)::timestamp with time zone
  INTO _event_datetime
  FROM events e
  WHERE e.id = _event_id AND e.status = 'active';
  
  IF _event_datetime IS NULL THEN
    RAISE EXCEPTION 'Evento não encontrado ou não está ativo.';
  END IF;
  
  -- 2. Verificar se já passou 4 horas do horário do evento
  _deadline := _event_datetime + interval '4 hours';
  IF now() > _deadline THEN
    RAISE EXCEPTION 'O prazo para inscrições neste evento foi encerrado.';
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