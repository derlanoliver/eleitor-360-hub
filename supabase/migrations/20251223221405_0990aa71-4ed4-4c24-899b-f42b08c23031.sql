-- Adicionar colunas PassKit na tabela integrations_settings
ALTER TABLE public.integrations_settings
ADD COLUMN IF NOT EXISTS passkit_api_key text,
ADD COLUMN IF NOT EXISTS passkit_api_secret text,
ADD COLUMN IF NOT EXISTS passkit_enabled boolean DEFAULT false;