ALTER TABLE public.integrations_settings
ADD COLUMN IF NOT EXISTS passkit_program_id text;

COMMENT ON COLUMN public.integrations_settings.passkit_program_id IS 'ID do programa de membros no PassKit';