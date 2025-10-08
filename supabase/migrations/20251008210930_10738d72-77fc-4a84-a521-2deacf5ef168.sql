-- ============================================================================
-- BLOCO 0.2 - MIGRAÇÃO 06: RLS Policies Tenant-Scoped (Corrigida)
-- ============================================================================

-- 1) Dropar policies antigas de profiles e lideres (do Bloco 0.1)
DROP POLICY IF EXISTS p_profiles_select ON profiles;
DROP POLICY IF EXISTS p_profiles_update ON profiles;
DROP POLICY IF EXISTS p_lideres_select ON lideres;
DROP POLICY IF EXISTS p_lideres_insert ON lideres;
DROP POLICY IF EXISTS p_lideres_update ON lideres;
DROP POLICY IF EXISTS p_lideres_delete ON lideres;

-- 2) Atualizar RLS de PROFILES com RBAC real
CREATE POLICY p_profiles_select
  ON profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_any_role(auth.uid(), ARRAY['admin','atendente']::app_role[], tenant_id)
  );

CREATE POLICY p_profiles_update
  ON profiles FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_role(auth.uid(), 'admin'::app_role, tenant_id)
  )
  WITH CHECK (
    auth.uid() = id
    OR has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_role(auth.uid(), 'admin'::app_role, tenant_id)
  );

-- 3) Atualizar RLS de LIDERES com RBAC real
CREATE POLICY p_lideres_select
  ON lideres FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_any_role(auth.uid(), ARRAY['admin','atendente']::app_role[], tenant_id)
  );

CREATE POLICY p_lideres_insert
  ON lideres FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_role(auth.uid(), 'admin'::app_role, tenant_id)
  );

CREATE POLICY p_lideres_update
  ON lideres FOR UPDATE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_role(auth.uid(), 'admin'::app_role, tenant_id)
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_role(auth.uid(), 'admin'::app_role, tenant_id)
  );

CREATE POLICY p_lideres_delete
  ON lideres FOR DELETE TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL)
    OR has_role(auth.uid(), 'admin'::app_role, tenant_id)
  );