-- Insert SMS template for meeting cancellation
INSERT INTO sms_templates (slug, nome, mensagem, categoria, variaveis)
VALUES (
  'visita-reuniao-cancelada',
  'Reunião Cancelada',
  'Olá {{nome}}, sua reunião no gabinete (Protocolo: {{protocolo}}) foi cancelada. Em breve entraremos em contato para reagendar uma nova data. Att, Gabinete {{deputado_nome}}',
  'visita',
  '["nome", "protocolo", "deputado_nome"]'
);

-- Insert SMS template for meeting rescheduling
INSERT INTO sms_templates (slug, nome, mensagem, categoria, variaveis)
VALUES (
  'visita-reuniao-reagendada',
  'Reunião Reagendada',
  'Olá {{nome}}, sua reunião foi reagendada para {{nova_data}}. Protocolo: {{protocolo}}. Att, Gabinete {{deputado_nome}}',
  'visita',
  '["nome", "protocolo", "nova_data", "deputado_nome"]'
);