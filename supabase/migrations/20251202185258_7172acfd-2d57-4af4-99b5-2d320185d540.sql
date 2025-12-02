-- Add column to control visibility of registration count on public event pages
ALTER TABLE events 
ADD COLUMN show_registrations_count BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN events.show_registrations_count IS 
  'Controla se o número de inscritos é exibido publicamente na página de inscrição';