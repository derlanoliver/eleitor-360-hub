-- ====================================================================
-- Migração 07: Header Tenant Helpers
-- Implementa resolução de tenant stateless via header HTTP
-- ====================================================================

-- Função: extrai tenant_id do header x-tenant-id
-- PostgREST expõe request.headers como JSON
CREATE OR REPLACE FUNCTION public.header_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.headers', true)::json->>'x-tenant-id',
      ''
    ),
    ''
  )::uuid
$$;

-- Função: resolve tenant efetivo para RLS
-- Prioridade: GUC > header > fallback único
CREATE OR REPLACE FUNCTION public.effective_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.tenant_id', true), '')::uuid,
    header_tenant(),
    get_single_tenant_for_user(auth.uid())
  )
$$;

-- ====================================================================
-- Atualizar RLS Policies para usar effective_tenant()
-- ====================================================================

-- PROFILES: SELECT
DROP POLICY IF EXISTS p_profiles_select ON public.profiles;
CREATE POLICY p_profiles_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant())
  );

-- PROFILES: UPDATE
DROP POLICY IF EXISTS p_profiles_update ON public.profiles;
CREATE POLICY p_profiles_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  )
  WITH CHECK (
    auth.uid() = id
    OR has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  );

-- LIDERES: SELECT
DROP POLICY IF EXISTS p_lideres_select ON public.lideres;
CREATE POLICY p_lideres_select
  ON public.lideres
  FOR SELECT
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant())
  );

-- LIDERES: INSERT
DROP POLICY IF EXISTS p_lideres_insert ON public.lideres;
CREATE POLICY p_lideres_insert
  ON public.lideres
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  );

-- LIDERES: UPDATE
DROP POLICY IF EXISTS p_lideres_update ON public.lideres;
CREATE POLICY p_lideres_update
  ON public.lideres
  FOR UPDATE
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  );

-- LIDERES: DELETE
DROP POLICY IF EXISTS p_lideres_delete ON public.lideres;
CREATE POLICY p_lideres_delete
  ON public.lideres
  FOR DELETE
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  );

-- USER_ROLES: SELECT (tenant-scoped)
DROP POLICY IF EXISTS p_user_roles_select_tenant ON public.user_roles;
CREATE POLICY p_user_roles_select_tenant
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = effective_tenant()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant())
  );

COMMENT ON FUNCTION public.header_tenant() IS 'Extrai tenant_id do header HTTP x-tenant-id para RLS stateless';
COMMENT ON FUNCTION public.effective_tenant() IS 'Resolve tenant com fallback: GUC > header > mono-tenant';