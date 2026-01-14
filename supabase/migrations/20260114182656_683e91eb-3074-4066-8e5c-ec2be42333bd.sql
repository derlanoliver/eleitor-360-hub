-- Adicionar colunas para SMSBarato na tabela integrations_settings
ALTER TABLE integrations_settings
ADD COLUMN IF NOT EXISTS smsbarato_api_key TEXT,
ADD COLUMN IF NOT EXISTS smsbarato_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_active_provider TEXT DEFAULT 'smsdev';

-- Adicionar coluna para identificar provedor na tabela sms_messages
ALTER TABLE sms_messages
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'smsdev';

-- Comentários para documentação
COMMENT ON COLUMN integrations_settings.smsbarato_api_key IS 'Chave de API do SMSBarato';
COMMENT ON COLUMN integrations_settings.smsbarato_enabled IS 'Se o SMSBarato está habilitado';
COMMENT ON COLUMN integrations_settings.sms_active_provider IS 'Provedor SMS ativo: smsdev ou smsbarato';
COMMENT ON COLUMN sms_messages.provider IS 'Provedor usado para enviar: smsdev ou smsbarato';