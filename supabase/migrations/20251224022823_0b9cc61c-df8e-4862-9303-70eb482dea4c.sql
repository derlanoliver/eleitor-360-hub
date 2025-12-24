-- Adicionar campos para integração com PassKit
ALTER TABLE lideres
ADD COLUMN IF NOT EXISTS passkit_member_id TEXT,
ADD COLUMN IF NOT EXISTS passkit_pass_installed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS passkit_installed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS passkit_uninstalled_at TIMESTAMP WITH TIME ZONE;

-- Índice para busca rápida por member_id
CREATE INDEX IF NOT EXISTS idx_lideres_passkit_member_id ON lideres(passkit_member_id);

-- Índice para filtrar líderes com cartão instalado
CREATE INDEX IF NOT EXISTS idx_lideres_passkit_installed ON lideres(passkit_pass_installed) WHERE passkit_pass_installed = true;

-- Comentários para documentação
COMMENT ON COLUMN lideres.passkit_member_id IS 'ID do membro no PassKit para envio de notificações push';
COMMENT ON COLUMN lideres.passkit_pass_installed IS 'Indica se o cartão está instalado na wallet do usuário';
COMMENT ON COLUMN lideres.passkit_installed_at IS 'Data/hora em que o cartão foi instalado';
COMMENT ON COLUMN lideres.passkit_uninstalled_at IS 'Data/hora em que o cartão foi desinstalado';