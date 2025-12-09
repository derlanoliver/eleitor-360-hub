-- Fix column ambiguity in upsert_contact_from_leader_form function
-- Explicitly qualify all column references with table names

CREATE OR REPLACE FUNCTION public.upsert_contact_from_leader_form(
  p_nome text, 
  p_email text, 
  p_telefone_norm text, 
  p_data_nascimento date, 
  p_cidade_id uuid, 
  p_endereco text, 
  p_leader_id uuid
)
RETURNS TABLE(
  contact_id uuid, 
  verification_code text, 
  is_new boolean, 
  is_verified boolean, 
  is_already_leader boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id UUID;
  v_verification_code TEXT;
  v_is_new BOOLEAN := false;
  v_is_verified BOOLEAN := false;
  v_is_already_leader BOOLEAN := false;
  v_existing_code TEXT;
BEGIN
  -- 1. Check if already an active leader by phone or email
  SELECT TRUE INTO v_is_already_leader
  FROM lideres l
  WHERE l.is_active = true
    AND (
      normalize_phone_e164(l.telefone) = p_telefone_norm
      OR lower(trim(l.email)) = lower(trim(p_email))
    )
  LIMIT 1;

  IF v_is_already_leader THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, false, true;
    RETURN;
  END IF;

  -- 2. Check if contact already exists by phone
  SELECT oc.id, oc.is_verified, oc.verification_code 
  INTO v_contact_id, v_is_verified, v_existing_code
  FROM office_contacts oc
  WHERE oc.telefone_norm = p_telefone_norm
  LIMIT 1;

  IF v_contact_id IS NOT NULL THEN
    -- Contact exists - update data
    UPDATE office_contacts SET
      nome = trim(p_nome),
      email = lower(trim(p_email)),
      data_nascimento = p_data_nascimento,
      cidade_id = p_cidade_id,
      endereco = trim(p_endereco),
      source_type = CASE WHEN source_type IS NULL OR source_type != 'lider' THEN 'lider' ELSE source_type END,
      source_id = CASE WHEN source_type IS NULL OR source_type != 'lider' THEN p_leader_id ELSE source_id END,
      updated_at = now()
    WHERE id = v_contact_id;

    -- If not verified and no code, generate new one
    IF NOT COALESCE(v_is_verified, false) AND v_existing_code IS NULL THEN
      v_verification_code := generate_verification_code();
      UPDATE office_contacts SET verification_code = v_verification_code WHERE id = v_contact_id;
    ELSE
      v_verification_code := v_existing_code;
    END IF;

    RETURN QUERY SELECT v_contact_id, v_verification_code, false, COALESCE(v_is_verified, false), false;
  ELSE
    -- New contact - insert
    v_verification_code := generate_verification_code();
    
    INSERT INTO office_contacts (
      nome, 
      email, 
      telefone_norm, 
      data_nascimento, 
      cidade_id, 
      endereco,
      source_type, 
      source_id, 
      is_verified, 
      verification_code
    ) VALUES (
      trim(p_nome), 
      lower(trim(p_email)), 
      p_telefone_norm, 
      p_data_nascimento, 
      p_cidade_id, 
      trim(p_endereco),
      'lider', 
      p_leader_id, 
      false, 
      v_verification_code
    )
    RETURNING id INTO v_contact_id;

    v_is_new := true;
    RETURN QUERY SELECT v_contact_id, v_verification_code, true, false, false;
  END IF;
END;
$$;

-- Ensure anon can execute this function
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_leader_form(text, text, text, date, uuid, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_leader_form(text, text, text, date, uuid, text, uuid) TO authenticated;