-- ============================================================================
-- Migration 03: Adicionar tenant_id às tabelas existentes
-- Migra dados para o tenant 'Rafael Prudente' e prepara multi-tenant
-- ============================================================================

-- Pegar o tenant_id do Rafael Prudente
DO $$
DECLARE 
  tid UUID;
BEGIN
  SELECT id INTO tid FROM tenants WHERE slug='rafael-prudente';
  
  IF tid IS NULL THEN
    RAISE EXCEPTION 'Tenant rafael-prudente não encontrado! Execute migration 01 primeiro.';
  END IF;

  -- ========================================
  -- PROFILES
  -- ========================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    UPDATE profiles SET tenant_id = tid WHERE tenant_id IS NULL;
    ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
  END IF;

  -- ========================================
  -- COORDENADORES -> LIDERES
  -- ========================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='coordenadores' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE coordenadores ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    UPDATE coordenadores SET tenant_id = tid WHERE tenant_id IS NULL;
    ALTER TABLE coordenadores ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX idx_coordenadores_tenant ON coordenadores(tenant_id);
  END IF;

  -- Renomear coordenadores -> lideres
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='coordenadores'
  ) THEN
    ALTER TABLE coordenadores RENAME TO lideres;
  END IF;

  -- ========================================
  -- BACKUP DE TABELAS LEGADAS
  -- ========================================
  
  -- admin_users (backup, não mais usado)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='admin_users'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='admin_users_bak_legacy'
  ) THEN
    ALTER TABLE admin_users RENAME TO admin_users_bak_legacy;
  END IF;

  -- user_sessions (backup, não mais usado)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='user_sessions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='user_sessions_bak_legacy'
  ) THEN
    ALTER TABLE user_sessions RENAME TO user_sessions_bak_legacy;
  END IF;

END$$;