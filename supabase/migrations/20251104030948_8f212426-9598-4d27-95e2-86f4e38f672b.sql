-- Adicionar coluna observacao na tabela office_contacts
ALTER TABLE office_contacts 
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Criar índice para melhorar performance nas buscas por telefone
CREATE INDEX IF NOT EXISTS idx_office_contacts_telefone_norm 
ON office_contacts(telefone_norm);

-- Criar índice para melhorar performance em ordenações por updated_at
CREATE INDEX IF NOT EXISTS idx_office_contacts_updated_at 
ON office_contacts(updated_at DESC);