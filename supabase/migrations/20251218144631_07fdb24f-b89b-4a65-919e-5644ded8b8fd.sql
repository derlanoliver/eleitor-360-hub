-- Atualizar função para permitir transição de SCHEDULED e REGISTERED para FORM_OPENED
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
    AND status IN ('LINK_SENT', 'SCHEDULED', 'REGISTERED');
  
  RETURN FOUND;
END;
$$;