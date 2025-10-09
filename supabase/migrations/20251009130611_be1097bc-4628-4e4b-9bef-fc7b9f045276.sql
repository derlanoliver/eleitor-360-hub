-- Permitir INSERT de contatos vindos do formulário de afiliado
CREATE POLICY "office_contacts_insert_from_affiliate"
ON public.office_contacts
FOR INSERT
TO anon
WITH CHECK (true);

-- Permitir UPDATE de contatos vindos do formulário de afiliado
CREATE POLICY "office_contacts_update_from_affiliate"
ON public.office_contacts
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Adicionar comentários explicativos
COMMENT ON POLICY "office_contacts_insert_from_affiliate" ON public.office_contacts IS 
'Permite que usuários não autenticados criem contatos via formulário de afiliado';

COMMENT ON POLICY "office_contacts_update_from_affiliate" ON public.office_contacts IS 
'Permite que usuários não autenticados atualizem contatos via formulário de afiliado (upsert)';