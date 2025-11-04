-- Adicionar coluna genero à tabela office_contacts
ALTER TABLE office_contacts 
ADD COLUMN genero TEXT CHECK (genero IN ('Masculino', 'Feminino', 'Não identificado')) 
DEFAULT 'Não identificado';

-- Adicionar comentário descritivo
COMMENT ON COLUMN office_contacts.genero IS 'Gênero identificado do contato baseado no nome';

-- Criar índice para otimizar filtros futuros
CREATE INDEX idx_office_contacts_genero ON office_contacts(genero);