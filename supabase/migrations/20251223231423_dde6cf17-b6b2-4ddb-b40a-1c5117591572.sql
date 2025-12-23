ALTER TABLE public.integrations_settings
ADD COLUMN IF NOT EXISTS passkit_tier_id text;

COMMENT ON COLUMN public.integrations_settings.passkit_tier_id IS 'ID do tier/nível de membros no PassKit';