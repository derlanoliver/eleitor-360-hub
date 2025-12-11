-- Insert SMS template for leader registration confirmation (for bulk sending/testing)
INSERT INTO sms_templates (slug, nome, mensagem, categoria, variaveis, is_active)
VALUES (
  'lider-cadastro-confirmado-sms',
  'Cadastro de Líder Confirmado',
  '{{nome}}, bem-vindo(a) a nossa rede! Seu link de indicacao: {{link_indicacao}} - Compartilhe e fortaleca o movimento!',
  'lideranca',
  '["nome", "link_indicacao"]'::jsonb,
  true
);