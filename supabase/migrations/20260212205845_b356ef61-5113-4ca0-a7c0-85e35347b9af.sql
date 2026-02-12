
-- Create a public RPC for leader verification lookup by phone
CREATE OR REPLACE FUNCTION public.lookup_leader_for_verification(phone_digits text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader record;
  v_last8 text;
  v_keyword text;
  v_wa_phone text;
BEGIN
  -- Validate input
  IF length(phone_digits) < 10 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Número inválido. Digite DDD + número.');
  END IF;

  v_last8 := right(phone_digits, 8);

  -- Try exact match first (multiple formats)
  SELECT id, nome_completo, telefone, verification_code, is_verified, verified_at
  INTO v_leader
  FROM lideres
  WHERE 
    telefone = '+55' || phone_digits
    OR telefone = '55' || phone_digits
    OR telefone = phone_digits
    OR telefone = '+' || phone_digits
  LIMIT 1;

  -- Fallback: match by last 8 digits
  IF v_leader IS NULL THEN
    SELECT id, nome_completo, telefone, verification_code, is_verified, verified_at
    INTO v_leader
    FROM lideres
    WHERE telefone IS NOT NULL
      AND length(regexp_replace(telefone, '\D', '', 'g')) >= 10
      AND right(regexp_replace(telefone, '\D', '', 'g'), 8) = v_last8
    LIMIT 1;
  END IF;

  IF v_leader IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Already verified
  IF v_leader.is_verified = true OR v_leader.verified_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_verified', 'nome', v_leader.nome_completo);
  END IF;

  -- No verification code
  IF v_leader.verification_code IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Este líder não possui código de verificação. Contate o administrador.');
  END IF;

  -- Get settings
  SELECT 
    COALESCE(verification_wa_keyword, 'CONFIRMAR'),
    COALESCE(verification_wa_zapi_phone, '5561981894692')
  INTO v_keyword, v_wa_phone
  FROM integrations_settings
  LIMIT 1;

  -- If no settings found, use defaults
  IF v_keyword IS NULL THEN
    v_keyword := 'CONFIRMAR';
    v_wa_phone := '5561981894692';
  END IF;

  RETURN jsonb_build_object(
    'status', 'ready',
    'leader', jsonb_build_object(
      'id', v_leader.id,
      'nome_completo', v_leader.nome_completo,
      'telefone', v_leader.telefone,
      'verification_code', v_leader.verification_code
    ),
    'keyword', v_keyword,
    'whatsAppPhone', v_wa_phone
  );
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.lookup_leader_for_verification(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_leader_for_verification(text) TO authenticated;
