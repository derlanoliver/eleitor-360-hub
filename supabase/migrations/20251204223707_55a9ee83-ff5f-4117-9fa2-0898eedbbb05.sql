-- Remover política antiga
DROP POLICY IF EXISTS "programas_modify" ON public.programas;

-- Criar nova política usando has_admin_access (que inclui super_admin)
CREATE POLICY "programas_modify" ON public.programas
  FOR ALL 
  USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));