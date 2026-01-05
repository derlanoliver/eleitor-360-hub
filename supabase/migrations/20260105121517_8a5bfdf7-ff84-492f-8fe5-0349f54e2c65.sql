-- Corrigir política SELECT para incluir super_admin
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT
  USING ((id = auth.uid()) OR has_admin_access(auth.uid()));

-- Corrigir política UPDATE para incluir super_admin
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users
  FOR UPDATE
  USING ((id = auth.uid()) OR has_admin_access(auth.uid()))
  WITH CHECK ((id = auth.uid()) OR has_admin_access(auth.uid()));