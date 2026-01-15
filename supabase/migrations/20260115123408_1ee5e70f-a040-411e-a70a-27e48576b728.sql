-- Add Disparopro SMS provider columns
ALTER TABLE integrations_settings
ADD COLUMN IF NOT EXISTS disparopro_usuario TEXT,
ADD COLUMN IF NOT EXISTS disparopro_senha TEXT,
ADD COLUMN IF NOT EXISTS disparopro_enabled BOOLEAN DEFAULT false;

-- Add comment to document the sms_active_provider column
COMMENT ON COLUMN integrations_settings.sms_active_provider IS 'Active SMS provider: smsdev, smsbarato, or disparopro';