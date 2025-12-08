-- Função SECURITY DEFINER para cadastro via link de líder
-- Bypassa RLS para usuários não autenticados de forma segura

CREATE OR REPLACE FUNCTION public.upsert_contact_from_leader_form(
  p_nome TEXT,
  p_email TEXT,
  p_telefone_norm TEXT,
  p_data_nascimento DATE,
  p_cidade_id UUID,
  p_endereco TEXT,
  p_leader_id UUID
)
RETURNS TABLE(
  contact_id UUID, 
  verification_code TEXT, 
  is_new BOOLEAN, 
  is_verified BOOLEAN, 
  is_already_leader BOOLEAN
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
  -- 1. Verificar se já é líder ativo pelo telefone ou email
  SELECT TRUE INTO v_is_already_leader
  FROM lideres 
  WHERE is_active = true
    AND (
      normalize_phone_e164(telefone) = p_telefone_norm
      OR lower(trim(email)) = lower(trim(p_email))
    )
  LIMIT 1;

  IF v_is_already_leader THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, false, true;
    RETURN;
  END IF;

  -- 2. Verificar se contato já existe pelo telefone
  SELECT id, is_verified, verification_code 
  INTO v_contact_id, v_is_verified, v_existing_code
  FROM office_contacts 
  WHERE telefone_norm = p_telefone_norm
  LIMIT 1;

  IF v_contact_id IS NOT NULL THEN
    -- Contato existe - atualizar dados
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

    -- Se não está verificado e não tem código, gerar novo
    IF NOT COALESCE(v_is_verified, false) AND v_existing_code IS NULL THEN
      v_verification_code := generate_verification_code();
      UPDATE office_contacts SET verification_code = v_verification_code WHERE id = v_contact_id;
    ELSE
      v_verification_code := v_existing_code;
    END IF;

    RETURN QUERY SELECT v_contact_id, v_verification_code, false, COALESCE(v_is_verified, false), false;
  ELSE
    -- Novo contato - inserir
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

-- Conceder permissão de execução para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_leader_form TO anon, authenticated;