-- Permitir que usuários públicos leiam formulários de visitas em andamento
-- Necessário para que o upsert funcione corretamente (precisa SELECT para detectar conflitos)
CREATE POLICY "office_visit_forms_select_public" ON office_visit_forms
  AS PERMISSIVE
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM office_visits 
      WHERE office_visits.id = office_visit_forms.visit_id 
      AND office_visits.status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'FORM_SUBMITTED')
    )
  );