
DROP FUNCTION IF EXISTS process_verification_keyword(TEXT, TEXT);

CREATE OR REPLACE FUNCTION process_verification_keyword(
  _phone TEXT,
  _token TEXT,
  OUT success BOOLEAN,
  OUT contact_type TEXT,
  OUT contact_id UUID,
  OUT contact_name TEXT,
  OUT error_code TEXT
) RETURNS RECORD
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
  _phone_already_validated BOOLEAN := false;
BEGIN
  SELECT * INTO _verification
  FROM contact_verifications cv
  WHERE cv.token = upper(_token)
    AND cv.status IN ('pending', 'awaiting_consent')
  FOR UPDATE;
  
  IF NOT FOUND THEN
    SELECT l.id, l.nome_completo, l.telefone, l.is_verified, l.verification_code
    INTO _leader
    FROM lideres l
    WHERE l.verification_code = upper(_token);
    
    IF FOUND THEN
      IF _leader.is_verified THEN
        success := false; contact_type := NULL; contact_id := NULL; contact_name := NULL; error_code := 'already_verified';
        RETURN;
      END IF;
      
      _phone_digits := regexp_replace(_phone, '\D', '', 'g');
      _phone_digits := right(_phone_digits, 8);
      _registered_digits := regexp_replace(COALESCE(_leader.telefone, ''), '\D', '', 'g');
      _registered_digits := right(_registered_digits, 8);
      
      IF _registered_digits = '' OR _phone_digits <> _registered_digits THEN
        success := false; contact_type := 'leader'; contact_id := _leader.id; contact_name := _leader.nome_completo; error_code := 'phone_mismatch';
        RETURN;
      END IF;
      
      _phone_already_validated := true;
      
      SELECT * INTO _verification
      FROM contact_verifications cv
      WHERE cv.contact_id = _leader.id
        AND cv.contact_type = 'leader'
        AND cv.status IN ('pending', 'awaiting_consent')
      ORDER BY cv.created_at DESC
      LIMIT 1
      FOR UPDATE;
      
      IF NOT FOUND THEN
        INSERT INTO contact_verifications (contact_id, contact_type, phone, token, method, status)
        VALUES (_leader.id, 'leader', _phone, upper(_token), 'whatsapp', 'awaiting_consent')
        RETURNING * INTO _verification;
        
        success := true; contact_type := 'leader'; contact_id := _leader.id; contact_name := _leader.nome_completo; error_code := NULL;
        RETURN;
      END IF;
      
      -- Update verification record phone to match sender
      IF _verification.phone IS DISTINCT FROM _phone THEN
        UPDATE contact_verifications SET phone = _phone WHERE id = _verification.id;
      END IF;
      
    ELSE
      SELECT cv.status INTO _verification
      FROM contact_verifications cv
      WHERE cv.token = upper(_token)
        AND cv.status = 'verified';
      
      IF FOUND THEN
        success := false; error_code := 'already_verified'; RETURN;
      END IF;
      
      PERFORM 1 FROM lideres WHERE verification_code = upper(_token) AND is_verified = true;
      IF FOUND THEN
        success := false; error_code := 'already_verified'; RETURN;
      END IF;
      
      success := false; error_code := 'token_not_found'; RETURN;
    END IF;
  END IF;
  
  -- Validate phone (skip if already validated against leader's registered phone)
  IF NOT _phone_already_validated THEN
    _phone_digits := regexp_replace(_phone, '\D', '', 'g');
    _phone_digits := right(_phone_digits, 8);
    
    _registered_phone := _verification.phone;
    _registered_digits := regexp_replace(_registered_phone, '\D', '', 'g');
    _registered_digits := right(_registered_digits, 8);
    
    IF _phone_digits <> _registered_digits THEN
      IF _verification.contact_type = 'leader' THEN
        SELECT nome_completo INTO _name FROM lideres WHERE id = _verification.contact_id;
      ELSE
        SELECT nome INTO _name FROM office_contacts WHERE id = _verification.contact_id;
      END IF;
      
      success := false; contact_type := _verification.contact_type; contact_id := _verification.contact_id; contact_name := _name; error_code := 'phone_mismatch';
      RETURN;
    END IF;
  END IF;
  
  UPDATE contact_verifications
  SET status = 'awaiting_consent',
      keyword_received_at = now()
  WHERE id = _verification.id;
  
  IF _verification.contact_type = 'leader' THEN
    SELECT nome_completo INTO _name FROM lideres WHERE id = _verification.contact_id;
  ELSE
    SELECT nome INTO _name FROM office_contacts WHERE id = _verification.contact_id;
  END IF;
  
  success := true; contact_type := _verification.contact_type; contact_id := _verification.contact_id; contact_name := _name; error_code := NULL;
END;
$$;
