-- 1. Dropar a função existente com assinatura correta (date, não text)
DROP FUNCTION IF EXISTS public.upsert_contact_from_leader_form(TEXT, TEXT, TEXT, DATE, UUID, TEXT, UUID);

-- 2. Criar a função corrigida
CREATE OR REPLACE FUNCTION public.upsert_contact_from_leader_form(
  p_nome TEXT,
  p_email TEXT,
  p_telefone_norm TEXT,
  p_data_nascimento TEXT,
  p_cidade_id UUID,
  p_endereco TEXT,
  p_leader_id UUID
)
RETURNS TABLE (
  contact_id UUID,
  verification_code TEXT,
  is_already_leader BOOLEAN,
  is_verified BOOLEAN,
  needs_verification BOOLEAN,
  already_referred_by_other_leader BOOLEAN,
  original_leader_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id UUID;
  v_verification_code TEXT;
  v_is_verified BOOLEAN := FALSE;
  v_existing_source_type TEXT;
  v_existing_source_id UUID;
  v_original_leader_name TEXT;
BEGIN
  -- 1. Verificar se é um líder ativo (pelo telefone)
  IF EXISTS(SELECT 1 FROM lideres WHERE telefone = p_telefone_norm AND is_active = true) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, TRUE, FALSE, FALSE, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- 2. Verificar se já existe contato com este telefone ou email
  SELECT id, source_type, source_id::uuid, is_verified
  INTO v_contact_id, v_existing_source_type, v_existing_source_id, v_is_verified
  FROM office_contacts
  WHERE telefone_norm = p_telefone_norm
     OR (email IS NOT NULL AND LOWER(email) = LOWER(p_email))
  LIMIT 1;

  -- 3. Se já existe e JÁ É indicação de outro líder, NÃO processar - retornar aviso
  IF v_contact_id IS NOT NULL 
     AND v_existing_source_type = 'lider' 
     AND v_existing_source_id IS NOT NULL 
     AND v_existing_source_id != p_leader_id THEN
    
    -- Buscar nome do líder original
    SELECT nome_completo INTO v_original_leader_name
    FROM lideres WHERE id = v_existing_source_id;
    
    RETURN QUERY SELECT 
      v_contact_id,
      NULL::TEXT,
      FALSE,
      v_is_verified,
      FALSE,
      TRUE,
      v_original_leader_name;
    RETURN;
  END IF;

  -- 4. Se já existe E está verificado (mesmo líder), apenas retornar
  IF v_contact_id IS NOT NULL AND v_is_verified THEN
    RETURN QUERY SELECT v_contact_id, NULL::TEXT, FALSE, TRUE, FALSE, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- 5. Se não existe, criar novo contato
  IF v_contact_id IS NULL THEN
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
      verification_code,
      is_active
    ) VALUES (
      p_nome,
      LOWER(p_email),
      p_telefone_norm,
      CASE WHEN p_data_nascimento != '' THEN p_data_nascimento::DATE ELSE NULL END,
      p_cidade_id,
      p_endereco,
      'lider',
      p_leader_id::TEXT,
      FALSE,
      v_verification_code,
      TRUE
    )
    RETURNING id INTO v_contact_id;
    
    RETURN QUERY SELECT v_contact_id, v_verification_code, FALSE, FALSE, TRUE, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- 6. Se existe mas não está verificado (e é do mesmo líder ou sem líder), atualizar
  v_verification_code := generate_verification_code();
  
  UPDATE office_contacts SET
    nome = p_nome,
    email = LOWER(p_email),
    data_nascimento = CASE WHEN p_data_nascimento != '' THEN p_data_nascimento::DATE ELSE data_nascimento END,
    cidade_id = p_cidade_id,
    endereco = p_endereco,
    source_type = 'lider',
    source_id = p_leader_id::TEXT,
    verification_code = v_verification_code,
    updated_at = NOW()
  WHERE id = v_contact_id;
  
  RETURN QUERY SELECT v_contact_id, v_verification_code, FALSE, FALSE, TRUE, FALSE, NULL::TEXT;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_leader_form TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_leader_form TO authenticated;

-- 4. Sincronizar contador de cadastros de TODOS os líderes
UPDATE lideres l
SET cadastros = (
  SELECT COUNT(*) 
  FROM office_contacts oc 
  WHERE oc.source_id::uuid = l.id 
    AND oc.source_type = 'lider'
);