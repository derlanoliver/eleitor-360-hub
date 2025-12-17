-- Adicionar colunas de agendamento à tabela office_visits
ALTER TABLE office_visits
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS scheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar valor SCHEDULED ao enum (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SCHEDULED' AND enumtypid = 'office_visit_status'::regtype) THEN
    ALTER TYPE office_visit_status ADD VALUE 'SCHEDULED' BEFORE 'REGISTERED';
  END IF;
END $$;

-- Criar template SMS para visita agendada
INSERT INTO sms_templates (slug, nome, mensagem, categoria, variaveis)
VALUES (
  'visita-agendada-link-formulario',
  'Visita Agendada - Link do Formulário',
  'Olá {{nome}}! Sua visita ao gabinete está agendada para {{data_agendada}} às {{hora_agendada}}. Complete seu cadastro: {{link_formulario}}',
  'visita',
  '["nome", "data_agendada", "hora_agendada", "link_formulario", "protocolo"]'
)
ON CONFLICT (slug) DO NOTHING;