-- Remover políticas antigas
DROP POLICY IF EXISTS office_settings_select ON public.office_settings;
DROP POLICY IF EXISTS office_settings_modify ON public.office_settings;
DROP POLICY IF EXISTS office_settings_insert ON public.office_settings;

-- Criar nova política de SELECT usando has_admin_access()
CREATE POLICY office_settings_select ON public.office_settings
  FOR SELECT
  USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- Criar nova política de modificação usando has_admin_access()
CREATE POLICY office_settings_modify ON public.office_settings
  FOR ALL
  USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));