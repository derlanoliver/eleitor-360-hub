-- Add affiliate form cover URL column to app_settings
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS affiliate_form_cover_url text DEFAULT NULL;