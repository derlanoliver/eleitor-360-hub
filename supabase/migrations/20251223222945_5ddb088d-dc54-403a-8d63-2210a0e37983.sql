-- Remover coluna api_secret e renomear api_key para api_token
ALTER TABLE public.integrations_settings DROP COLUMN IF EXISTS passkit_api_secret;
ALTER TABLE public.integrations_settings RENAME COLUMN passkit_api_key TO passkit_api_token;