-- Dropar função existente e recriar com verificação de duplicata
DROP FUNCTION IF EXISTS create_event_registration(uuid, text, text, text, uuid, uuid, text, text, text, text, date, text);

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
AS $$
DECLARE
  _new_id uuid;
  _created_at timestamptz;
  _normalized_phone text;
BEGIN
  -- Normalizar telefone para comparação (apenas dígitos)
  _normalized_phone := regexp_replace(_whatsapp, '[^0-9]', '', 'g');
  
  -- Verificar se já existe inscrição por email OU telefone neste evento
  IF EXISTS (
    SELECT 1 FROM event_registrations 
    WHERE event_id = _event_id 
    AND (
      lower(email) = lower(_email) 
      OR regexp_replace(whatsapp, '[^0-9]', '', 'g') = _normalized_phone
    )
  ) THEN
    RAISE EXCEPTION 'Você já está inscrito neste evento.';
  END IF;

  -- Inserir registro
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