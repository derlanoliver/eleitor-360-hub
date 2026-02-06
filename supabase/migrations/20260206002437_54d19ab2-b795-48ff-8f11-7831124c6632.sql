-- Add fallback tracking columns to integrations_settings
ALTER TABLE public.integrations_settings 
ADD COLUMN IF NOT EXISTS verification_fallback_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS zapi_last_connected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS zapi_disconnected_at timestamp with time zone;

-- Drop existing function to allow signature change
DROP FUNCTION IF EXISTS public.get_verification_settings();

-- Create updated RPC to return effective verification method based on fallback status
CREATE OR REPLACE FUNCTION public.get_verification_settings()
RETURNS TABLE(
  verification_method text,
  verification_wa_enabled boolean,
  verification_wa_test_mode boolean,
  verification_wa_whitelist jsonb,
  verification_wa_keyword text,
  verification_wa_zapi_phone text,
  verification_fallback_active boolean,
  zapi_disconnected_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- If fallback is active AND method was whatsapp_consent, return 'link'
    CASE 
      WHEN i.verification_fallback_active = true 
           AND i.verification_method = 'whatsapp_consent'
      THEN 'link'::text
      ELSE COALESCE(i.verification_method, 'link')::text
    END as verification_method,
    COALESCE(i.verification_wa_enabled, false) as verification_wa_enabled,
    COALESCE(i.verification_wa_test_mode, true) as verification_wa_test_mode,
    COALESCE(i.verification_wa_whitelist, '[]'::jsonb) as verification_wa_whitelist,
    COALESCE(i.verification_wa_keyword, 'CONFIRMAR') as verification_wa_keyword,
    i.verification_wa_zapi_phone as verification_wa_zapi_phone,
    COALESCE(i.verification_fallback_active, false) as verification_fallback_active,
    i.zapi_disconnected_at as zapi_disconnected_at
  FROM integrations_settings i
  LIMIT 1;
END;
$$;

-- Grant execute permission to anon users (for public forms)
GRANT EXECUTE ON FUNCTION public.get_verification_settings() TO anon;
GRANT EXECUTE ON FUNCTION public.get_verification_settings() TO authenticated;