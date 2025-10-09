-- Permitir SELECT público em office_visits para carregar dados do formulário
CREATE POLICY "office_visits_select_public"
ON office_visits
FOR SELECT
TO anon
USING (true);

-- Permitir SELECT público em office_contacts quando vinculado a uma visita
CREATE POLICY "office_contacts_select_public"
ON office_contacts
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM office_visits 
    WHERE office_visits.contact_id = office_contacts.id
  )
);