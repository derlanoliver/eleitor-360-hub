-- Criar função auxiliar para verificar acesso administrativo (admin ou super_admin)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

-- Atualizar política de office_contacts para incluir super_admin
DROP POLICY IF EXISTS "office_contacts_select_auth" ON public.office_contacts;
CREATE POLICY "office_contacts_select_auth" ON public.office_contacts
  FOR SELECT USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "office_contacts_insert_auth" ON public.office_contacts;
CREATE POLICY "office_contacts_insert_auth" ON public.office_contacts
  FOR INSERT WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "office_contacts_update_auth" ON public.office_contacts;
CREATE POLICY "office_contacts_update_auth" ON public.office_contacts
  FOR UPDATE USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'))
  WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "office_contacts_delete_auth" ON public.office_contacts;
CREATE POLICY "office_contacts_delete_auth" ON public.office_contacts
  FOR DELETE USING (has_admin_access(auth.uid()));

-- Atualizar política de whatsapp_messages
DROP POLICY IF EXISTS "whatsapp_messages_select_admin" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_select_admin" ON public.whatsapp_messages
  FOR SELECT USING (has_admin_access(auth.uid()));

-- Atualizar política de email_logs (se existir)
DROP POLICY IF EXISTS "email_logs_select" ON public.email_logs;
CREATE POLICY "email_logs_select" ON public.email_logs
  FOR SELECT USING (has_admin_access(auth.uid()));

-- Atualizar política de profiles para membros da equipe
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR has_admin_access(auth.uid()));

-- Atualizar política de office_visits
DROP POLICY IF EXISTS "office_visits_all" ON public.office_visits;
CREATE POLICY "office_visits_all" ON public.office_visits
  FOR ALL USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'))
  WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'));

-- Atualizar política de office_visit_forms
DROP POLICY IF EXISTS "office_visit_forms_select" ON public.office_visit_forms;
CREATE POLICY "office_visit_forms_select" ON public.office_visit_forms
  FOR SELECT USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'));

-- Atualizar política de email_templates
DROP POLICY IF EXISTS "email_templates_select" ON public.email_templates;
CREATE POLICY "email_templates_select" ON public.email_templates
  FOR SELECT USING (has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "email_templates_modify" ON public.email_templates;
CREATE POLICY "email_templates_modify" ON public.email_templates
  FOR ALL USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));

-- Atualizar política de integrations_settings
DROP POLICY IF EXISTS "integrations_settings_select" ON public.integrations_settings;
CREATE POLICY "integrations_settings_select" ON public.integrations_settings
  FOR SELECT USING (has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "integrations_settings_modify" ON public.integrations_settings;
CREATE POLICY "integrations_settings_modify" ON public.integrations_settings
  FOR ALL USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));