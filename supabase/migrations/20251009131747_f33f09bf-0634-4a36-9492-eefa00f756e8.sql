-- Remover política UPDATE redundante que causa conflito no upsert
-- Problema: office_contacts_update_from_form exige visita pré-existente,
-- mas a visita só é criada APÓS o upsert do contato
DROP POLICY IF EXISTS "office_contacts_update_from_form" ON public.office_contacts;

-- Adicionar comentário explicativo na política que permanece
COMMENT ON POLICY "office_contacts_update_from_affiliate" ON public.office_contacts IS 
'Permite que usuários anônimos façam UPDATE via formulário de afiliado durante upsert. Não exige visita pré-existente pois a visita é criada após o upsert do contato.';