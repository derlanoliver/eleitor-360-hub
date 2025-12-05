-- Create SECURITY DEFINER function for event registration
-- This allows anonymous users to register for events without RLS issues
CREATE OR REPLACE FUNCTION public.create_event_registration(
  _event_id uuid,
  _nome text,
  _email text,
  _whatsapp text,
  _cidade_id uuid DEFAULT NULL,
  _leader_id uuid DEFAULT NULL,
  _utm_source text DEFAULT NULL,
  _utm_medium text DEFAULT NULL,
  _utm_campaign text DEFAULT NULL,
  _utm_content text DEFAULT NULL
)
RETURNS TABLE (id uuid, qr_code text, checked_in boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _registration_id uuid;
  _registration_qr_code text;
BEGIN
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
$$;