-- Add phone number columns for Meta Cloud and 360dialog
ALTER TABLE public.integrations_settings 
ADD COLUMN IF NOT EXISTS meta_cloud_phone text,
ADD COLUMN IF NOT EXISTS dialog360_phone text;

COMMENT ON COLUMN public.integrations_settings.meta_cloud_phone IS 'Número de WhatsApp (E.164) associado à Cloud API';
COMMENT ON COLUMN public.integrations_settings.dialog360_phone IS 'Número de WhatsApp (E.164) associado à 360dialog';
