-- ============================================================================
-- BLOCO 0.2 - MIGRAÇÃO 05: RBAC Core (Papéis e Funções Auxiliares)
-- ============================================================================

-- 1) Criar enum de papéis se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM (
      'super_admin',
      'super_user',
      'admin',
      'atendente',
      'checkin_operator'
    );
  END IF;
END$$;

-- 2) Criar tabela user_roles (mapeia usuário ↔ papel ↔ tenant)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);

-- 3) Substituir função has_role (era stub, agora implementação real)
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role, _tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (tenant_id IS NULL OR tenant_id = COALESCE(_tenant_id, tenant_id))
  )
$$;

-- 4) Nova função: has_any_role (verifica lista de papéis)
CREATE OR REPLACE FUNCTION has_any_role(_user_id UUID, _roles app_role[], _tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = ANY(_roles)
      AND (ur.tenant_id IS NULL OR ur.tenant_id = COALESCE(_tenant_id, ur.tenant_id))
  )
$$;

-- 5) Nova função: current_tenant (retorna tenant da sessão via GUC)
CREATE OR REPLACE FUNCTION current_tenant()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT current_setting('app.tenant_id', true)::uuid
$$;

-- 6) Nova função utilitária: grant_role_by_email
CREATE OR REPLACE FUNCTION grant_role_by_email(_email TEXT, _role app_role, _tenant_slug TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _tid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = _email;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Usuário % não encontrado em auth.users', _email;
  END IF;

  IF _tenant_slug IS NULL THEN
    INSERT INTO user_roles (user_id, tenant_id, role)
    VALUES (_uid, NULL, _role)
    ON CONFLICT (user_id, tenant_id, role) DO NOTHING;
  ELSE
    SELECT id INTO _tid FROM tenants WHERE slug = _tenant_slug;
    IF _tid IS NULL THEN
      RAISE EXCEPTION 'Tenant com slug % não encontrado', _tenant_slug;
    END IF;
    INSERT INTO user_roles (user_id, tenant_id, role)
    VALUES (_uid, _tid, _role)
    ON CONFLICT (user_id, tenant_id, role) DO NOTHING;
  END IF;
END;
$$;

-- 7) Habilitar RLS em user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 8) Policies para user_roles: super perfis globais veem tudo
CREATE POLICY p_user_roles_select_super
  ON user_roles FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
  );

-- 9) Admin/Atendente só veem papéis do seu tenant
CREATE POLICY p_user_roles_select_tenant
  ON user_roles FOR SELECT
  USING (
    tenant_id = current_tenant()
    AND has_any_role(auth.uid(), ARRAY['admin','atendente']::app_role[], current_tenant())
  );

-- 10) Inserir papéis: somente super_admin/super_user global
CREATE POLICY p_user_roles_insert_super
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
  );

-- 11) Atualizar papéis: super_admin global OU admin do tenant
CREATE POLICY p_user_roles_update
  ON user_roles FOR UPDATE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR (tenant_id = current_tenant() AND has_role(auth.uid(),'admin'::app_role, current_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR (tenant_id = current_tenant() AND has_role(auth.uid(),'admin'::app_role, current_tenant()))
  );

-- 12) Deletar papéis: super_admin global OU admin do tenant
CREATE POLICY p_user_roles_delete
  ON user_roles FOR DELETE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR (tenant_id = current_tenant() AND has_role(auth.uid(),'admin'::app_role, current_tenant()))
  );