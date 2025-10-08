-- ============================================================================
-- Migration 04: RLS e Funções Helper
-- Habilita RLS, cria funções de papel e policies base
-- ============================================================================

-- ========================================
-- HABILITAR RLS NAS NOVAS TABELAS
-- ========================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS nas tabelas do cliente (se ainda não estiver)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='lideres') THEN
    ALTER TABLE lideres ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- ========================================
-- FUNÇÕES HELPER
-- ========================================

-- Função stub has_role (será implementada no Bloco 0.2 com user_roles)
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role TEXT, _tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Stub: retorna FALSE por ora; será implementada no Bloco 0.2
  SELECT FALSE
$$;

-- Função para pegar tenant único do usuário (útil durante transição)
CREATE OR REPLACE FUNCTION get_single_tenant_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Por ora, retorna o tenant Rafael Prudente para qualquer usuário autenticado
  -- No Bloco 0.2, será ajustada para consultar user_roles
  SELECT id FROM tenants WHERE slug = 'rafael-prudente' LIMIT 1
$$;

-- ========================================
-- POLICIES PARA TENANTS (apenas leitura para super perfis)
-- ========================================

DROP POLICY IF EXISTS p_tenants_select ON tenants;
CREATE POLICY p_tenants_select
  ON tenants FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  );

DROP POLICY IF EXISTS p_tenant_domains_select ON tenant_domains;
CREATE POLICY p_tenant_domains_select
  ON tenant_domains FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  );

DROP POLICY IF EXISTS p_tenant_settings_select ON tenant_settings;
CREATE POLICY p_tenant_settings_select
  ON tenant_settings FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  );

DROP POLICY IF EXISTS p_tenant_branding_select ON tenant_branding;
CREATE POLICY p_tenant_branding_select
  ON tenant_branding FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  );

-- ========================================
-- POLICIES PARA PROFILES (tenant-scoped)
-- ========================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY p_profiles_select
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    tenant_id = get_single_tenant_for_user(auth.uid()) OR
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  );

CREATE POLICY p_profiles_update
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    tenant_id = get_single_tenant_for_user(auth.uid()) OR
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  )
  WITH CHECK (
    auth.uid() = id OR
    tenant_id = get_single_tenant_for_user(auth.uid()) OR
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  );

-- ========================================
-- POLICIES PARA LIDERES (tenant-scoped)
-- ========================================

DROP POLICY IF EXISTS "Permitir leitura pública de coordenadores" ON lideres;

CREATE POLICY p_lideres_select
  ON lideres FOR SELECT
  USING (
    tenant_id = get_single_tenant_for_user(auth.uid()) OR
    has_role(auth.uid(), 'super_admin', NULL) OR
    has_role(auth.uid(), 'super_user', NULL)
  );

CREATE POLICY p_lideres_insert
  ON lideres FOR INSERT
  WITH CHECK (
    tenant_id = get_single_tenant_for_user(auth.uid()) OR
    has_role(auth.uid(), 'super_admin', NULL)
  );

CREATE POLICY p_lideres_update
  ON lideres FOR UPDATE
  USING (
    tenant_id = get_single_tenant_for_user(auth.uid()) OR
    has_role(auth.uid(), 'super_admin', NULL)
  )
  WITH CHECK (
    tenant_id = get_single_tenant_for_user(auth.uid()) OR
    has_role(auth.uid(), 'super_admin', NULL)
  );

CREATE POLICY p_lideres_delete
  ON lideres FOR DELETE
  USING (
    has_role(auth.uid(), 'super_admin', NULL)
  );