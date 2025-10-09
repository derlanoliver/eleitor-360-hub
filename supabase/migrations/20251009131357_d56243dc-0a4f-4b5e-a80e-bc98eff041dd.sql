-- Corrigir política RLS para separar roles authenticated e anon
-- Isso resolve o conflito que impede upsert de usuários anônimos

-- Remover política que se aplica a 'public' (todos os usuários)
DROP POLICY IF EXISTS "office_contacts_all" ON public.office_contacts;

-- Recriar política apenas para usuários autenticados (admin/atendente)
CREATE POLICY "office_contacts_all"
ON public.office_contacts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

-- Adicionar comentário explicativo
COMMENT ON POLICY "office_contacts_all" ON public.office_contacts IS 
'Permite que admins e atendentes autenticados façam todas as operações. Separado do role anon para evitar conflitos no upsert do formulário público.';