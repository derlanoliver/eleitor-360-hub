-- Remover políticas existentes que serão substituídas
DROP POLICY IF EXISTS "office_contacts_all" ON office_contacts;
DROP POLICY IF EXISTS "office_contacts_insert_from_affiliate" ON office_contacts;
DROP POLICY IF EXISTS "office_contacts_update_from_affiliate" ON office_contacts;

-- Política para SELECT - admins e atendentes
CREATE POLICY "office_contacts_select_auth"
ON office_contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'atendente'::app_role)
);

-- Política para INSERT - admins e atendentes
CREATE POLICY "office_contacts_insert_auth"
ON office_contacts
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'atendente'::app_role)
);

-- Política para UPDATE - admins e atendentes
CREATE POLICY "office_contacts_update_auth"
ON office_contacts
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'atendente'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'atendente'::app_role)
);

-- Política para DELETE - apenas admins
CREATE POLICY "office_contacts_delete_auth"
ON office_contacts
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Política pública para inserção via formulário de afiliado (já existe office_contacts_select_public para SELECT)
CREATE POLICY "office_contacts_insert_public_form"
ON office_contacts
FOR INSERT
WITH CHECK (
  source_type = 'lider' AND source_id IS NOT NULL
);

-- Política pública para update via formulário de afiliado
CREATE POLICY "office_contacts_update_public_form"
ON office_contacts
FOR UPDATE
USING (true)
WITH CHECK (true);