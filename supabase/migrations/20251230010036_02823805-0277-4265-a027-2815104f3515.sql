-- Remover política existente
DROP POLICY IF EXISTS "app_settings_modify" ON public.app_settings;

-- Criar nova política que permite acesso para admin E super_admin
CREATE POLICY "app_settings_admin_access" ON public.app_settings
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );