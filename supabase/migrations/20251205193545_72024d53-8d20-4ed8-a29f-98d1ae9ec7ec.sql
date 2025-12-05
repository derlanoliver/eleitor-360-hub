-- =============================================
-- FIX ERROR-LEVEL SECURITY VULNERABILITIES
-- =============================================

-- 1. Create SECURITY DEFINER function for safe visit lookup by QR code
CREATE OR REPLACE FUNCTION public.get_visit_by_qr(_qr_code text)
RETURNS TABLE (
  id uuid,
  status office_visit_status,
  checked_in boolean,
  checked_in_at timestamptz,
  protocolo text,
  contact_nome text,
  contact_telefone text,
  city_nome text,
  leader_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.status,
    v.checked_in,
    v.checked_in_at,
    v.protocolo,
    c.nome as contact_nome,
    c.telefone_norm as contact_telefone,
    ci.nome as city_nome,
    l.nome_completo as leader_nome
  FROM office_visits v
  LEFT JOIN office_contacts c ON c.id = v.contact_id
  LEFT JOIN office_cities ci ON ci.id = v.city_id
  LEFT JOIN lideres l ON l.id = v.leader_id
  WHERE v.qr_code = _qr_code
  LIMIT 1;
END;
$$;

-- 2. Create SECURITY DEFINER function for safe check-in update
CREATE OR REPLACE FUNCTION public.checkin_visit_by_qr(_qr_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _visit_id uuid;
  _current_status office_visit_status;
BEGIN
  -- Find the visit by QR code
  SELECT id, status INTO _visit_id, _current_status
  FROM office_visits
  WHERE qr_code = _qr_code;
  
  -- Validate visit exists and is in valid state for check-in
  IF _visit_id IS NULL THEN
    RETURN false;
  END IF;
  
  IF _current_status NOT IN ('FORM_SUBMITTED', 'CHECKED_IN') THEN
    RETURN false;
  END IF;
  
  -- Update the visit
  UPDATE office_visits
  SET 
    checked_in = true,
    checked_in_at = now(),
    status = 'CHECKED_IN'
  WHERE id = _visit_id;
  
  RETURN true;
END;
$$;

-- 3. Create SECURITY DEFINER function for safe event registration lookup by QR code
CREATE OR REPLACE FUNCTION public.get_registration_by_qr(_qr_code text)
RETURNS TABLE (
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
  event_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    e.category as event_category
  FROM event_registrations r
  LEFT JOIN events e ON e.id = r.event_id
  WHERE r.qr_code = _qr_code
  LIMIT 1;
END;
$$;

-- 4. Create SECURITY DEFINER function for safe event check-in update
CREATE OR REPLACE FUNCTION public.checkin_event_by_qr(_qr_code text, _checked_in boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _registration_id uuid;
BEGIN
  -- Find the registration by QR code
  SELECT id INTO _registration_id
  FROM event_registrations
  WHERE qr_code = _qr_code;
  
  IF _registration_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update the registration
  UPDATE event_registrations
  SET 
    checked_in = _checked_in,
    checked_in_at = CASE WHEN _checked_in THEN now() ELSE NULL END
  WHERE id = _registration_id;
  
  RETURN true;
END;
$$;

-- 5. Drop dangerous public policies on office_visits
DROP POLICY IF EXISTS "office_visits_select_public" ON office_visits;
DROP POLICY IF EXISTS "office_visits_update_status_public" ON office_visits;

-- 6. Drop dangerous public policy on event_registrations
DROP POLICY IF EXISTS "Authenticated users can view registrations by qr_code" ON event_registrations;

-- 7. Update lideres_select to restrict to admin/atendente roles only
DROP POLICY IF EXISTS "lideres_select" ON lideres;
CREATE POLICY "lideres_select" ON lideres
FOR SELECT
USING (
  has_admin_access(auth.uid()) 
  OR has_role(auth.uid(), 'atendente'::app_role)
);