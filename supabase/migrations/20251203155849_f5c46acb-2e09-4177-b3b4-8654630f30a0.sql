-- Remover política existente que restringe apenas admin/atendente
DROP POLICY IF EXISTS "lideres_select" ON public.lideres;

-- Criar nova política que permite qualquer usuário autenticado ver líderes
CREATE POLICY "lideres_select" ON public.lideres
FOR SELECT
USING (auth.uid() IS NOT NULL);