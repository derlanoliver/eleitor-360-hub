-- Adicionar policy específica para INSERT em office_settings
CREATE POLICY office_settings_insert ON public.office_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar políticas RLS para tabelas sem políticas
-- perfil_demografico: tabela de dados demográficos públicos
CREATE POLICY perfil_demografico_select ON public.perfil_demografico
FOR SELECT
USING (true);

CREATE POLICY perfil_demografico_modify ON public.perfil_demografico
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- regiao_administrativa: tabela de RAs públicas
CREATE POLICY regiao_administrativa_select ON public.regiao_administrativa
FOR SELECT
USING (true);

CREATE POLICY regiao_administrativa_modify ON public.regiao_administrativa
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- temas: tabela de temas públicos
CREATE POLICY temas_select ON public.temas
FOR SELECT
USING (true);

CREATE POLICY temas_modify ON public.temas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- platform_admins: apenas super admins podem acessar
CREATE POLICY platform_admins_select ON public.platform_admins
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY platform_admins_modify ON public.platform_admins
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));