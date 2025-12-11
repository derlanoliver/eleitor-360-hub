-- Fix get_registration_by_qr function to use categories array instead of category column
CREATE OR REPLACE FUNCTION get_registration_by_qr(_qr_code TEXT)
RETURNS TABLE(
  id uuid,
  nome text,
  checked_in boolean,
  checked_in_at timestamp with time zone,
  event_id uuid,
  event_name text,
  event_date date,
  event_time time without time zone,
  event_location text,
  event_address text,
  event_category text
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.nome,
    r.checked_in,
    r.checked_in_at,
    r.event_id,
    e.name as event_name,
    e.date as event_date,
    e.time as event_time,
    e.location as event_location,
    e.address as event_address,
    e.categories[1] as event_category
  FROM event_registrations r
  LEFT JOIN events e ON e.id = r.event_id
  WHERE r.qr_code = _qr_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;