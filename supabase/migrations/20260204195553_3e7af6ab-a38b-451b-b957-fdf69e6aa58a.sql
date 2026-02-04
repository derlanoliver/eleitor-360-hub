-- WhatsApp Cloud API (Meta) Settings
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  whatsapp_provider_active TEXT DEFAULT 'zapi' CHECK (whatsapp_provider_active IN ('zapi', 'meta_cloud'));

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_enabled BOOLEAN DEFAULT false;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_test_mode BOOLEAN DEFAULT true;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_whitelist JSONB DEFAULT '[]'::jsonb;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_phone_number_id TEXT;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_waba_id TEXT;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_api_version TEXT DEFAULT 'v20.0';

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_fallback_enabled BOOLEAN DEFAULT false;

-- WhatsApp Messages - Provider tracking and idempotency
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS 
  provider TEXT DEFAULT 'zapi';

ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS 
  client_message_id TEXT;

-- Índice para idempotência
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_messages_client_id 
  ON whatsapp_messages(client_message_id) WHERE client_message_id IS NOT NULL;