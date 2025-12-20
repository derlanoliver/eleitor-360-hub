-- Adicionar colunas para controle individual de mensagens automáticas de WhatsApp
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_verificacao_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_captacao_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_pesquisa_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_evento_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_lideranca_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_membro_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_visita_enabled BOOLEAN DEFAULT true;
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS wa_auto_optout_enabled BOOLEAN DEFAULT true;