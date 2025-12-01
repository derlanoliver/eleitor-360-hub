-- Add column for customizable logo URL in affiliate form
ALTER TABLE app_settings 
ADD COLUMN affiliate_form_logo_url text DEFAULT NULL;