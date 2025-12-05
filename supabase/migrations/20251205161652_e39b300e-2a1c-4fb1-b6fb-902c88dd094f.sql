-- Fix 1: Remove dangerous office_contacts_select_public policy
-- This policy exposed all contact PII to anonymous users
DROP POLICY IF EXISTS "office_contacts_select_public" ON public.office_contacts;

-- Fix 2: Create secure function for public form settings
-- Returns ONLY safe columns (URLs, titles, subtitles) - NO API credentials
CREATE OR REPLACE FUNCTION public.get_public_form_settings()
RETURNS TABLE(
  affiliate_form_cover_url text,
  affiliate_form_logo_url text,
  leader_form_cover_url text,
  leader_form_logo_url text,
  leader_form_title text,
  leader_form_subtitle text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.affiliate_form_cover_url,
    s.affiliate_form_logo_url,
    s.leader_form_cover_url,
    s.leader_form_logo_url,
    s.leader_form_title,
    s.leader_form_subtitle
  FROM app_settings s
  LIMIT 1;
END;
$$;

-- Fix 3: Remove dangerous app_settings_select_public policy
-- This policy exposed Facebook API credentials to anyone
DROP POLICY IF EXISTS "app_settings_select_public" ON public.app_settings;