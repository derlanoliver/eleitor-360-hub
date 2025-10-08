-- ============================================================================
-- Migration 01: Core Tenants
-- Cria tabelas base de multi-tenant (tenants, domains, settings, branding)
-- ============================================================================

-- Requisitos básicos
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum de status do tenant
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'cancelled');
  END IF;
END$$;

-- Tabela tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status tenant_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela tenant_domains
CREATE TABLE IF NOT EXISTS tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  ssl_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Constraint: apenas 1 domínio primário por tenant (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_tenant 
ON tenant_domains (tenant_id, is_primary) 
WHERE is_primary = true;

-- Tabela tenant_settings (JSONB flexível)
CREATE TABLE IF NOT EXISTS tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  organization_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela tenant_branding
CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  primary_color TEXT NOT NULL DEFAULT '#F25822',
  logo_url TEXT,
  favicon_url TEXT,
  typography_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed do tenant 'Rafael Prudente' + domínio primário
DO $$
DECLARE
  tid UUID;
BEGIN
  SELECT id INTO tid FROM tenants WHERE slug = 'rafael-prudente';
  IF tid IS NULL THEN
    INSERT INTO tenants (name, slug, status)
    VALUES ('Rafael Prudente', 'rafael-prudente', 'active')
    RETURNING id INTO tid;
  END IF;

  -- domínio primário de homologação
  IF NOT EXISTS (
    SELECT 1 FROM tenant_domains WHERE tenant_id = tid AND domain = 'rafael.eleitor360.ai'
  ) THEN
    INSERT INTO tenant_domains (tenant_id, domain, is_primary, ssl_status)
    VALUES (tid, 'rafael.eleitor360.ai', true, 'active');
  END IF;

  -- settings default
  IF NOT EXISTS (SELECT 1 FROM tenant_settings WHERE tenant_id = tid) THEN
    INSERT INTO tenant_settings (tenant_id, organization_data)
    VALUES (tid, jsonb_build_object('default_ra','Brasília'));
  END IF;

  -- branding default
  IF NOT EXISTS (SELECT 1 FROM tenant_branding WHERE tenant_id = tid) THEN
    INSERT INTO tenant_branding (tenant_id, primary_color)
    VALUES (tid, '#F25822');
  END IF;
END$$;