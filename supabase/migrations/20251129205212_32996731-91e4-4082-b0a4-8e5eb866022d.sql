-- Permitir que usuários públicos atualizem formulários de visitas
-- apenas se a visita ainda não foi finalizada (check-in ou reunião)
CREATE POLICY "office_visit_forms_update_public" ON office_visit_forms
  AS PERMISSIVE
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM office_visits 
      WHERE office_visits.id = office_visit_forms.visit_id 
      AND office_visits.status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'FORM_SUBMITTED')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM office_visits 
      WHERE office_visits.id = office_visit_forms.visit_id 
      AND office_visits.status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'FORM_SUBMITTED')
    )
  );