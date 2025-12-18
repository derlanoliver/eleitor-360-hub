-- Adicionar política UPDATE pública para office_visits
-- Necessária para permitir atualização de status após envio do formulário público
CREATE POLICY "office_visits_update_public_for_form" ON public.office_visits
FOR UPDATE
TO anon, authenticated
USING (
  status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'SCHEDULED')
)
WITH CHECK (
  status = 'FORM_SUBMITTED'
);