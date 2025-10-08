-- ============================================================================
-- BLOCO 0.2 - FIX: Corrigir search_path da função current_tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION current_tenant()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('app.tenant_id', true)::uuid
$$;