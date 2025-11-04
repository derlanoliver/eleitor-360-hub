-- Adicionar novos campos à tabela lideres
ALTER TABLE lideres 
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Criar índice para data_nascimento para otimizar buscas por idade
CREATE INDEX IF NOT EXISTS idx_lideres_data_nascimento ON lideres(data_nascimento);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN lideres.data_nascimento IS 'Data de nascimento do líder';
COMMENT ON COLUMN lideres.endereco_completo IS 'Endereço completo do líder';
COMMENT ON COLUMN lideres.observacao IS 'Observações sobre o líder';