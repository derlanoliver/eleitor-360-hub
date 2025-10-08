-- Passo 2: Atualizar políticas para usar as funções security definer

-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "p_platform_admins_select" ON platform_admins;
DROP POLICY IF EXISTS "p_platform_admins_modify" ON platform_admins;

-- Criar novas políticas seguras
CREATE POLICY "p_platform_admins_select_new"
ON platform_admins
FOR SELECT
USING (
  -- Platform admins podem ver sua própria linha
  auth.uid() = id
  OR
  -- Super admins podem ver todos
  public.is_super_admin(auth.uid())
);

CREATE POLICY "p_platform_admins_insert_new"
ON platform_admins
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
);

CREATE POLICY "p_platform_admins_update_new"
ON platform_admins
FOR UPDATE
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "p_platform_admins_delete_new"
ON platform_admins
FOR DELETE
USING (public.is_super_admin(auth.uid()));