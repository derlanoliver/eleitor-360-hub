-- Update get_verification_settings to support whatsapp_meta_cloud method with cascading fallback
-- Fallback chain: whatsapp_meta_cloud → whatsapp_consent (Z-API) → link (SMS)

DROP FUNCTION IF EXISTS public.get_verification_settings();

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
DECLARE
  v_method text;
  v_fallback boolean;
  v_zapi_connected boolean;
  v_meta_enabled boolean;
BEGIN
  -- Get raw settings
  SELECT 
    COALESCE(i.verification_method, 'link'),
    COALESCE(i.verification_fallback_active, false),
    COALESCE(i.meta_cloud_enabled, false)
  INTO v_method, v_fallback, v_meta_enabled
  FROM integrations_settings i
  LIMIT 1;

  -- Cascading fallback logic:
  -- If method is whatsapp_meta_cloud and Meta Cloud is down (fallback_active or not enabled), try Z-API
  -- If Z-API is also down (fallback_active), fall back to SMS (link)
  IF v_method = 'whatsapp_meta_cloud' THEN
    -- Check if Meta Cloud is working (we consider it down if not enabled)
    IF NOT v_meta_enabled THEN
      -- Fallback to Z-API (whatsapp_consent)
      v_method := 'whatsapp_consent';
      v_fallback := true;
    END IF;
  END IF;

  -- If method is whatsapp_consent and Z-API is disconnected (fallback active), fall back to SMS
  IF v_method = 'whatsapp_consent' AND v_fallback = true THEN
    v_method := 'link';
  END IF;

  RETURN QUERY
  SELECT 
    v_method as verification_method,
    COALESCE(i.verification_wa_enabled, false) as verification_wa_enabled,
    COALESCE(i.verification_wa_test_mode, true) as verification_wa_test_mode,
    COALESCE(i.verification_wa_whitelist, '[]'::jsonb) as verification_wa_whitelist,
    COALESCE(i.verification_wa_keyword, 'CONFIRMAR') as verification_wa_keyword,
    i.verification_wa_zapi_phone as verification_wa_zapi_phone,
    v_fallback as verification_fallback_active,
    i.zapi_disconnected_at as zapi_disconnected_at
  FROM integrations_settings i
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verification_settings() TO anon;
GRANT EXECUTE ON FUNCTION public.get_verification_settings() TO authenticated;