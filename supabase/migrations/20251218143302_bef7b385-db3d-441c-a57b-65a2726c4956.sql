DROP FUNCTION IF EXISTS get_visit_for_public_form(uuid);

CREATE OR REPLACE FUNCTION get_visit_for_public_form(_visit_id uuid)
RETURNS TABLE (
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
  scheduled_time time
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;