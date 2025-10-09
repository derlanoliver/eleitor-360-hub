-- Remover função stub
DROP FUNCTION IF EXISTS public.has_role(uuid, text, uuid) CASCADE;

-- Remover a versão com tenant_id para evitar ambiguidade
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role, uuid) CASCADE;

-- Recriar todas as políticas usando has_role(uuid, app_role)

-- Tabela: lideres
CREATE POLICY lideres_modify ON public.lideres
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY lideres_select ON public.lideres
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'atendente'::app_role)
);

-- Tabela: office_visits
CREATE POLICY office_visits_all ON public.office_visits
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'atendente'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'atendente'::app_role)
);

-- Tabela: office_contacts
CREATE POLICY office_contacts_all ON public.office_contacts
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'atendente'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'atendente'::app_role)
);

-- Tabela: office_settings
CREATE POLICY office_settings_select ON public.office_settings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'atendente'::app_role)
);

CREATE POLICY office_settings_modify ON public.office_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela: user_roles
CREATE POLICY user_roles_select ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY user_roles_modify ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela: users
CREATE POLICY users_select ON public.users
FOR SELECT
USING (
  id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY users_update ON public.users
FOR UPDATE
USING (
  id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Tabela: profiles
CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (
  id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Tabela: office_cities
CREATE POLICY office_cities_modify ON public.office_cities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela: office_visit_forms
CREATE POLICY office_visit_forms_select ON public.office_visit_forms
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'atendente'::app_role)
);

CREATE POLICY office_visit_forms_update ON public.office_visit_forms
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));