-- ============================================================================
-- FASE 1: Criar Tenant Especial para Eleitor360.ai
-- ============================================================================

-- Inserir tenant especial com UUID fixo
INSERT INTO public.tenants (
  id,
  name,
  slug,
  status,
  account_code
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Eleitor360.ai',
  'eleitor360',
  'active'::tenant_status,
  9999999
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FASE 2: Criar Nova Tabela Unificada `users`
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = true;

-- ============================================================================
-- FASE 3: Migrar Dados Existentes
-- ============================================================================

-- Migrar dados de platform_admins (vão para o tenant Eleitor360.ai)
INSERT INTO public.users (id, email, name, tenant_id, is_active, created_at, updated_at, last_login)
SELECT 
  pa.id,
  pa.email,
  pa.name,
  '00000000-0000-0000-0000-000000000001'::uuid,
  pa.is_active,
  pa.created_at,
  pa.updated_at,
  pa.last_login
FROM public.platform_admins pa
ON CONFLICT (id) DO NOTHING;

-- Migrar dados de profiles (mantêm seus tenant_id originais)
INSERT INTO public.users (id, email, name, tenant_id, is_active, created_at, updated_at, last_login)
SELECT 
  p.id,
  p.email,
  p.name,
  p.tenant_id,
  true,
  p.created_at,
  p.updated_at,
  NULL
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FASE 4: Configurar RLS na Tabela `users`
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver seus próprios dados
CREATE POLICY "users_select_own" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy: Super admins podem ver todos os usuários
CREATE POLICY "users_select_super_admin" 
ON public.users 
FOR SELECT 
USING (
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
);

-- Policy: Admins de tenant podem ver usuários do próprio tenant
CREATE POLICY "users_select_tenant_admin" 
ON public.users 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role, effective_tenant()) 
  AND tenant_id = effective_tenant()
);

-- Policy: Super admins podem modificar qualquer usuário
CREATE POLICY "users_modify_super_admin" 
ON public.users 
FOR ALL 
USING (
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
);

-- Policy: Admins de tenant podem modificar usuários do próprio tenant
CREATE POLICY "users_modify_tenant_admin" 
ON public.users 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role, effective_tenant()) 
  AND tenant_id = effective_tenant()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role, effective_tenant()) 
  AND tenant_id = effective_tenant()
);

-- ============================================================================
-- FASE 5: Atualizar Trigger `handle_new_user()` para Usar Tabela Unificada
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
  _email_domain TEXT;
BEGIN
  _email_domain := split_part(NEW.email, '@', 2);
  
  -- Se é usuário @eleitor360.ai, atribui ao tenant especial
  IF _email_domain = 'eleitor360.ai' THEN
    _tenant_id := '00000000-0000-0000-0000-000000000001'::uuid;
  ELSE
    -- Para outros usuários, busca tenant_id nos metadados
    _tenant_id := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
    
    -- Se não fornecido, usa tenant rafael-prudente como fallback
    IF _tenant_id IS NULL THEN
      SELECT id INTO _tenant_id 
      FROM tenants 
      WHERE slug = 'rafael-prudente' 
      LIMIT 1;
    END IF;
    
    -- Se ainda não encontrou tenant, retorna erro
    IF _tenant_id IS NULL THEN
      RAISE EXCEPTION 'tenant_id é obrigatório e não foi encontrado';
    END IF;
  END IF;

  -- Inserir usuário na tabela unificada
  INSERT INTO public.users (id, email, name, tenant_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    _tenant_id,
    true
  );
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FASE 6: Criar Trigger para Atualizar `updated_at`
-- ============================================================================

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FASE 7: Remover Tabelas Antigas (APÓS VALIDAÇÃO)
-- ============================================================================

-- IMPORTANTE: Só execute estas linhas APÓS validar que tudo está funcionando!
-- Por segurança, deixo comentado inicialmente:

-- DROP TABLE IF EXISTS public.platform_admins CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

-- Verificação de dados migrados
DO $$
DECLARE
  user_count INTEGER;
  tenant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO tenant_count FROM public.tenants WHERE id = '00000000-0000-0000-0000-000000000001';
  
  RAISE NOTICE '✅ Migração concluída!';
  RAISE NOTICE '📊 Total de usuários na tabela unificada: %', user_count;
  RAISE NOTICE '🏢 Tenant Eleitor360.ai criado: %', CASE WHEN tenant_count > 0 THEN 'SIM' ELSE 'NÃO' END;
END $$;