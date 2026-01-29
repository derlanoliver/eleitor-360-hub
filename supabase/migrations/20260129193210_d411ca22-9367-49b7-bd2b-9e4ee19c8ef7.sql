-- Remover política antiga
DROP POLICY IF EXISTS sms_templates_modify ON sms_templates;

-- Criar nova política usando has_admin_access (que já aceita admin e super_admin)
CREATE POLICY sms_templates_modify ON sms_templates
FOR ALL
TO public
USING (has_admin_access(auth.uid()))
WITH CHECK (has_admin_access(auth.uid()));