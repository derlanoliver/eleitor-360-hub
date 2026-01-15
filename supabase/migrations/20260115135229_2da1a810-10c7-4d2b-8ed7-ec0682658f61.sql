-- Update Disparopro to use Bearer Token instead of usuario/senha
ALTER TABLE integrations_settings
DROP COLUMN IF EXISTS disparopro_usuario,
DROP COLUMN IF EXISTS disparopro_senha,
ADD COLUMN IF NOT EXISTS disparopro_token TEXT;

COMMENT ON COLUMN integrations_settings.disparopro_token IS 'Bearer token for Disparopro API authentication';