-- Função SECURITY DEFINER para buscar visita por ID (usuários públicos)
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
  qr_code text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    v.qr_code
  FROM office_visits v
  JOIN office_contacts c ON c.id = v.contact_id
  JOIN office_cities ci ON ci.id = v.city_id
  WHERE v.id = _visit_id
    AND v.status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'FORM_SUBMITTED');
END;
$$;

-- Função SECURITY DEFINER para atualizar status da visita para FORM_OPENED
CREATE OR REPLACE FUNCTION public.update_visit_status_form_opened(_visit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE office_visits
  SET status = 'FORM_OPENED', updated_at = now()
  WHERE id = _visit_id
    AND status = 'LINK_SENT';
  
  RETURN FOUND;
END;
$$;