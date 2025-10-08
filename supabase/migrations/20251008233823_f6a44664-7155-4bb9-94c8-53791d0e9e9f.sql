-- Criar função security definer para verificar se é platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM platform_admins
    WHERE id = _user_id
      AND is_active = true
  )
$$;

-- Criar função para verificar se é super admin especificamente
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM platform_admins
    WHERE id = _user_id
      AND role = 'super_admin'
      AND is_active = true
  )
$$;

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "p_platform_admins_select" ON platform_admins;
DROP POLICY IF EXISTS "p_platform_admins_modify" ON platform_admins;

-- Recriar políticas usando as funções security definer
CREATE POLICY "p_platform_admins_select"
ON platform_admins
FOR SELECT
USING (
  -- Platform admins podem ver sua própria linha
  auth.uid() = id
  OR
  -- Super admins podem ver todos os platform admins
  public.is_super_admin(auth.uid())
);

CREATE POLICY "p_platform_admins_insert"
ON platform_admins
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
);

CREATE POLICY "p_platform_admins_update"
ON platform_admins
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
)
WITH CHECK (
  public.is_super_admin(auth.uid())
);

CREATE POLICY "p_platform_admins_delete"
ON platform_admins
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
);