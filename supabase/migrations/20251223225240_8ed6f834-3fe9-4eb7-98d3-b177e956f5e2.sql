ALTER TABLE public.integrations_settings
ADD COLUMN IF NOT EXISTS passkit_api_base_url text;

UPDATE public.integrations_settings
SET passkit_api_base_url = COALESCE(passkit_api_base_url, 'https://api.pub1.passkit.io');

ALTER TABLE public.integrations_settings
ALTER COLUMN passkit_api_base_url SET DEFAULT 'https://api.pub1.passkit.io';