-- Bloco 1.1: Configurações do Tenant (Organização/Branding/Domínios)
-- Criação de RLS policies para tenant_settings, tenant_branding, tenant_domains

-- Índice de apoio em tenant_domains
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);

-- Habilitar RLS nas tabelas (já devem estar, mas garantimos)
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES: tenant_settings
-- ========================================

-- SELECT: super_* ou tenant atual
DROP POLICY IF EXISTS p_tenant_settings_select ON tenant_settings;
CREATE POLICY p_tenant_settings_select
  ON tenant_settings FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    tenant_id = effective_tenant()
  );

-- INSERT/UPDATE/DELETE: super_* ou admin do tenant
DROP POLICY IF EXISTS p_tenant_settings_modify ON tenant_settings;
CREATE POLICY p_tenant_settings_modify
  ON tenant_settings FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  );

-- ========================================
-- POLICIES: tenant_branding
-- ========================================

-- SELECT: super_* ou tenant atual
DROP POLICY IF EXISTS p_tenant_branding_select ON tenant_branding;
CREATE POLICY p_tenant_branding_select
  ON tenant_branding FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    tenant_id = effective_tenant()
  );

-- INSERT/UPDATE/DELETE: super_* ou admin do tenant
DROP POLICY IF EXISTS p_tenant_branding_modify ON tenant_branding;
CREATE POLICY p_tenant_branding_modify
  ON tenant_branding FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  );

-- ========================================
-- POLICIES: tenant_domains
-- ========================================

-- SELECT: super_* ou tenant atual
DROP POLICY IF EXISTS p_tenant_domains_select ON tenant_domains;
CREATE POLICY p_tenant_domains_select
  ON tenant_domains FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    tenant_id = effective_tenant()
  );

-- INSERT/UPDATE/DELETE: super_* ou admin do tenant
DROP POLICY IF EXISTS p_tenant_domains_modify ON tenant_domains;
CREATE POLICY p_tenant_domains_modify
  ON tenant_domains FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','super_user']::app_role[], NULL) OR
    (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  );