-- Permitir que created_by seja NULL para formulários de afiliado
ALTER TABLE office_visits 
ALTER COLUMN created_by DROP NOT NULL;

-- Adicionar comentário para documentar o comportamento
COMMENT ON COLUMN office_visits.created_by IS 
'ID do usuário que criou a visita. NULL indica que foi criada via formulário público de afiliado.';