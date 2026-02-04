-- Templates WhatsApp para verificação (corrigido: variaveis como JSONB)
INSERT INTO whatsapp_templates (slug, nome, mensagem, categoria, variaveis, is_active)
VALUES 
  ('wa-verificacao-consent', 'Verificação - Consentimento', 
   'Olá {{nome}}! Recebemos sua solicitação de verificação. Você autoriza a verificação do seu cadastro na plataforma? Responda *SIM* para confirmar.',
   'verificacao', '["nome"]'::jsonb, true),
  ('wa-verificacao-sucesso', 'Verificação - Sucesso',
   '{{nome}}, seu cadastro foi verificado com sucesso! 🎉 Seu link de indicação: {{link_indicacao}}',
   'verificacao', '["nome", "link_indicacao"]'::jsonb, true),
  ('wa-verificacao-invalido', 'Verificação - Token Inválido',
   'Olá! O código de verificação informado não foi encontrado. Por favor, verifique se digitou corretamente ou faça um novo cadastro.',
   'verificacao', '[]'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;