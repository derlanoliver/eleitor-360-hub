-- Adicionar coluna account_code na tabela tenants
ALTER TABLE tenants ADD COLUMN account_code SERIAL UNIQUE;

-- Atualizar RLS policy para platform admins verem todos os tenants
DROP POLICY IF EXISTS p_tenants_select ON tenants;

CREATE POLICY p_tenants_select ON tenants
  FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND tenant_id = tenants.id
    )
  );

-- Função para verificar se um usuário pode acessar um tenant
CREATE OR REPLACE FUNCTION can_access_tenant(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (
    -- Platform admins podem acessar qualquer tenant
    has_any_role(_user_id, ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR
    -- Usuários podem acessar seu próprio tenant
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = _user_id AND tenant_id = _tenant_id
    )
  )
$$;