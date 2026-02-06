
-- Add 360dialog columns to integrations_settings
ALTER TABLE public.integrations_settings
  ADD COLUMN IF NOT EXISTS dialog360_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dialog360_api_key text,
  ADD COLUMN IF NOT EXISTS dialog360_phone_number_id text,
  ADD COLUMN IF NOT EXISTS dialog360_test_mode boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS dialog360_whitelist jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dialog360_fallback_enabled boolean DEFAULT false;
