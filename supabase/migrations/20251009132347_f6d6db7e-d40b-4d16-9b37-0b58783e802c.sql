-- Adicionar política SELECT para permitir upsert verificar existência por telefone
-- Problema: upsert precisa fazer SELECT para decidir entre INSERT/UPDATE,
-- mas office_contacts_select_public exige visita que ainda não existe

CREATE POLICY "office_contacts_select_for_upsert"
ON public.office_contacts
FOR SELECT
TO anon
USING (telefone_norm IS NOT NULL);

-- Comentário explicativo
COMMENT ON POLICY "office_contacts_select_for_upsert" ON public.office_contacts IS 
'Permite que usuários anônimos façam SELECT por telefone durante upsert no formulário de afiliado. Necessário para o PostgreSQL decidir entre INSERT ou UPDATE.';