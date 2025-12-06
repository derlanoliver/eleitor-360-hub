-- Remover política antiga que só verifica 'admin'
DROP POLICY IF EXISTS organization_modify ON organization;

-- Criar nova política usando has_admin_access() que reconhece admin e super_admin
CREATE POLICY organization_modify ON organization
  FOR ALL
  USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));