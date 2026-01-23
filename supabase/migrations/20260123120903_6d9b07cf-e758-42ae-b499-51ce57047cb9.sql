-- Criar índice único para evitar duplicatas por telefone no mesmo evento
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_unique_phone 
ON event_registrations (event_id, regexp_replace(whatsapp, '[^0-9]', '', 'g'));