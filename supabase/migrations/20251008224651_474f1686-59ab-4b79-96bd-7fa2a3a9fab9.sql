-- =====================================================
-- FASE 1: ISOLAMENTO MULTI-TENANT
-- Separar usuários da plataforma (@eleitor360.ai) dos usuários de tenants
-- =====================================================

-- 1. Criar tabela platform_admins (administradores globais)
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role app_role NOT NULL CHECK (role IN ('super_admin', 'super_user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Índice para otimizar consultas por email
CREATE INDEX idx_platform_admins_email ON platform_admins(email);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_platform_admins_updated_at
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. RLS para platform_admins
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "p_platform_admins_select"
ON platform_admins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE pa.id = auth.uid() AND pa.role = 'super_admin'
  )
);

CREATE POLICY "p_platform_admins_modify"
ON platform_admins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE pa.id = auth.uid() AND pa.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE pa.id = auth.uid() AND pa.role = 'super_admin'
  )
);

-- 3. Modificar profiles: tenant_id sempre obrigatório
ALTER TABLE profiles 
ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Recriar trigger handle_new_user com roteamento por domínio
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
  _tenant_id UUID;
  _email_domain TEXT;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  _email_domain := split_part(NEW.email, '@', 2);
  
  -- Verificar se é administrador da plataforma (@eleitor360.ai)
  IF _email_domain = 'eleitor360.ai' THEN
    -- Validar role global
    IF _role NOT IN ('super_admin', 'super_user') THEN
      RAISE EXCEPTION 'Usuários @eleitor360.ai devem ter role super_admin ou super_user';
    END IF;
    
    -- Inserir em platform_admins
    INSERT INTO public.platform_admins (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      _role::app_role
    );
    
    RETURN NEW;
  END IF;
  
  -- Usuário de tenant: inserir em profiles
  _tenant_id := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
  
  IF _tenant_id IS NULL THEN
    SELECT id INTO _tenant_id 
    FROM tenants 
    WHERE slug = 'rafael-prudente' 
    LIMIT 1;
  END IF;
  
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id é obrigatório para usuários que não são @eleitor360.ai';
  END IF;

  INSERT INTO public.profiles (id, email, name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    _role,
    _tenant_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Criar função get_user_context para autenticação inteligente
CREATE OR REPLACE FUNCTION public.get_user_context(user_id UUID)
RETURNS TABLE (
  user_type TEXT,
  user_data JSONB,
  accessible_tenants UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _platform_admin platform_admins%ROWTYPE;
  _tenant_profile profiles%ROWTYPE;
BEGIN
  -- Verificar se é admin da plataforma
  SELECT * INTO _platform_admin
  FROM platform_admins
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT
      'platform_admin'::TEXT,
      jsonb_build_object(
        'id', _platform_admin.id,
        'email', _platform_admin.email,
        'name', _platform_admin.name,
        'role', _platform_admin.role
      ),
      (SELECT ARRAY_AGG(t.id) FROM tenants t WHERE t.status = 'active');
  END IF;
  
  -- Verificar se é admin de tenant
  SELECT * INTO _tenant_profile
  FROM profiles
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT
      'tenant_admin'::TEXT,
      jsonb_build_object(
        'id', _tenant_profile.id,
        'email', _tenant_profile.email,
        'name', _tenant_profile.name,
        'role', _tenant_profile.role,
        'tenant_id', _tenant_profile.tenant_id
      ),
      ARRAY[_tenant_profile.tenant_id];
  END IF;
  
  -- Usuário não encontrado
  RETURN QUERY SELECT
    'unknown'::TEXT,
    '{}'::JSONB,
    ARRAY[]::UUID[];
END;
$$;