
CREATE OR REPLACE FUNCTION public.process_verification_keyword(
  _token TEXT,
  _phone TEXT
)
RETURNS TABLE(success BOOLEAN, contact_type TEXT, contact_id UUID, contact_name TEXT, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _verification RECORD;
  _name TEXT;
  _registered_phone TEXT;
  _phone_digits TEXT;
  _registered_digits TEXT;
  _leader RECORD;
BEGIN
  -- Buscar verificacao ativa pelo token de contact_verifications
  SELECT * INTO _verification
  FROM contact_verifications cv
  WHERE cv.token = upper(_token)
    AND cv.status IN ('pending', 'awaiting_consent')
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Token not found in contact_verifications - try lideres.verification_code
    SELECT l.id, l.nome_completo, l.telefone, l.is_verified, l.verification_code
    INTO _leader
    FROM lideres l
    WHERE l.verification_code = upper(_token);
    
    IF FOUND THEN
      -- Leader found by verification_code
      IF _leader.is_verified THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'already_verified'::TEXT;
        RETURN;
      END IF;
      
      -- Find the corresponding contact_verification record for this leader
      SELECT * INTO _verification
      FROM contact_verifications cv
      WHERE cv.contact_id = _leader.id
        AND cv.contact_type = 'leader'
        AND cv.status IN ('pending', 'awaiting_consent')
      ORDER BY cv.created_at DESC
      LIMIT 1
      FOR UPDATE;
      
      IF NOT FOUND THEN
        -- No pending verification record exists, but leader exists and is not verified
        -- Return token_not_found so the system can guide the user
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'token_not_found'::TEXT;
        RETURN;
      END IF;
      
      -- Fall through to phone validation below with the found _verification record
    ELSE
      -- Check if already verified in contact_verifications
      SELECT cv.status INTO _verification
      FROM contact_verifications cv
      WHERE cv.token = upper(_token)
        AND cv.status = 'verified';
      
      IF FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'already_verified'::TEXT;
        RETURN;
      END IF;
      
      -- Check if already verified in lideres
      PERFORM 1 FROM lideres WHERE verification_code = upper(_token) AND is_verified = true;
      IF FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'already_verified'::TEXT;
        RETURN;
      END IF;
      
      RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'token_not_found'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Validate phone: extract last 8 digits and compare
  _phone_digits := regexp_replace(_phone, '\D', '', 'g');
  _phone_digits := right(_phone_digits, 8);
  
  -- Get registered phone from the verification record
  _registered_phone := _verification.phone;
  _registered_digits := regexp_replace(_registered_phone, '\D', '', 'g');
  _registered_digits := right(_registered_digits, 8);
  
  IF _phone_digits <> _registered_digits THEN
    -- Phone mismatch - get name for the response
    IF _verification.contact_type = 'leader' THEN
      SELECT nome_completo INTO _name FROM lideres WHERE id = _verification.contact_id;
    ELSE
      SELECT nome INTO _name FROM office_contacts WHERE id = _verification.contact_id;
    END IF;
    
    RETURN QUERY SELECT false, _verification.contact_type, _verification.contact_id, _name, 'phone_mismatch'::TEXT;
    RETURN;
  END IF;
  
  -- Phone matches - update status to awaiting_consent
  UPDATE contact_verifications
  SET status = 'awaiting_consent',
      keyword_received_at = now()
  WHERE id = _verification.id;
  
  -- Buscar nome
  IF _verification.contact_type = 'leader' THEN
    SELECT nome_completo INTO _name FROM lideres WHERE id = _verification.contact_id;
  ELSE
    SELECT nome INTO _name FROM office_contacts WHERE id = _verification.contact_id;
  END IF;
  
  RETURN QUERY SELECT true, _verification.contact_type, _verification.contact_id, _name, NULL::TEXT;
END;
$$;
