-- Fix security linter: set immutable search_path on functions

CREATE OR REPLACE FUNCTION public.generate_leader_affiliate_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _token TEXT;
  _exists BOOLEAN;
BEGIN
  LOOP
    _token := substring(md5(random()::text || clock_timestamp()::text) from 1 for 8);

    SELECT EXISTS(SELECT 1 FROM lideres WHERE affiliate_token = _token) INTO _exists;

    EXIT WHEN NOT _exists;
  END LOOP;

  RETURN _token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_registration_by_qr(_qr_code text)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_visit_for_public_form(_visit_id uuid)
RETURNS TABLE(
  id uuid,
  protocolo text,
  status text,
  contact_id uuid,
  contact_nome text,
  contact_telefone text,
  city_id uuid,
  city_nome text,
  qr_code text,
  scheduled_date date,
  scheduled_time time without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.protocolo,
    v.status::text,
    v.contact_id,
    c.nome as contact_nome,
    c.telefone_norm as contact_telefone,
    v.city_id,
    ci.nome as city_nome,
    v.qr_code,
    v.scheduled_date,
    v.scheduled_time
  FROM office_visits v
  JOIN office_contacts c ON c.id = v.contact_id
  JOIN office_cities ci ON ci.id = v.city_id
  WHERE v.id = _visit_id
    AND v.status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'FORM_SUBMITTED', 'SCHEDULED');
END;
$function$;