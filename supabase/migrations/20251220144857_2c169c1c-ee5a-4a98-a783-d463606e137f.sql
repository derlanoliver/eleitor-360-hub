-- Adicionar coluna para controlar o fallback de SMS para WhatsApp
ALTER TABLE integrations_settings 
ADD COLUMN IF NOT EXISTS wa_auto_sms_fallback_enabled BOOLEAN DEFAULT false;

-- Inserir template para fallback de verificação via WhatsApp
INSERT INTO whatsapp_templates (slug, nome, mensagem, categoria, variaveis, is_active)
VALUES (
  'verificacao-sms-fallback',
  'Verificação - Fallback SMS',
  'Olá {{nome}}! 👋

Tentamos enviar um SMS de verificação para você *6 vezes*, mas infelizmente não conseguimos entregar. Por isso, estamos entrando em contato por aqui.

Para confirmar seu cadastro, por favor *responda esta mensagem* com o código abaixo:

*{{codigo}}*

Basta copiar e colar o código acima como resposta nesta conversa. ✅',
  'verificacao',
  '["nome", "codigo"]',
  true
)
ON CONFLICT (slug) DO NOTHING;