-- Adicionar novos status ao enum
ALTER TYPE office_visit_status ADD VALUE IF NOT EXISTS 'MEETING_COMPLETED';
ALTER TYPE office_visit_status ADD VALUE IF NOT EXISTS 'RESCHEDULED';

-- Adicionar campos de reagendamento
ALTER TABLE office_visits 
ADD COLUMN IF NOT EXISTS rescheduled_date DATE,
ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP WITH TIME ZONE;