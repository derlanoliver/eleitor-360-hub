-- Create secure function to get WhatsApp verification settings for public forms
-- Returns ONLY safe columns - NO API tokens or credentials
CREATE OR REPLACE FUNCTION public.get_verification_settings()
RETURNS TABLE(
  verification_method text,
  verification_wa_enabled boolean,
  verification_wa_test_mode boolean,
  verification_wa_keyword text,
  verification_wa_whitelist jsonb,
  verification_wa_zapi_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.verification_method,
    COALESCE(i.verification_wa_enabled, false),
    COALESCE(i.verification_wa_test_mode, false),
    i.verification_wa_keyword,
    i.verification_wa_whitelist,
    i.verification_wa_zapi_phone
  FROM integrations_settings i
  LIMIT 1;
END;
$$;