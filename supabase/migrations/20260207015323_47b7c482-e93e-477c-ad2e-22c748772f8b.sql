ALTER TABLE integrations_settings
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_hours_start text DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_end text DEFAULT '08:00';