-- Dropar e recriar função get_registration_by_qr com campo registration_deadline_hours
DROP FUNCTION IF EXISTS get_registration_by_qr(text);

CREATE FUNCTION get_registration_by_qr(_qr_code text)
RETURNS TABLE(
  id uuid,
  nome text,
  checked_in boolean,
  checked_in_at timestamptz,
  event_id uuid,
  event_name text,
  event_date date,
  event_time time,
  event_location text,
  event_address text,
  event_category text,
  event_registration_deadline_hours integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    er.id,
    er.nome,
    er.checked_in,
    er.checked_in_at,
    e.id as event_id,
    e.name as event_name,
    e.date as event_date,
    e.time as event_time,
    e.location as event_location,
    e.address as event_address,
    e.categories[1] as event_category,
    e.registration_deadline_hours as event_registration_deadline_hours
  FROM event_registrations er
  JOIN events e ON e.id = er.event_id
  WHERE er.qr_code = _qr_code;
$$;