-- Adicionar política SELECT pública mínima para office_visits
-- Necessária para permitir o EXISTS na política de office_visit_forms funcionar
CREATE POLICY "office_visits_select_public_for_form" ON public.office_visits
FOR SELECT
TO anon, authenticated
USING (
  status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'FORM_SUBMITTED', 'SCHEDULED')
);