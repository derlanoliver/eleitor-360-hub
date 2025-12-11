
-- Fix ambiguous column references in upsert_contact_from_leader_form function
CREATE OR REPLACE FUNCTION public.upsert_contact_from_leader_form(p_nome text, p_email text, p_telefone_norm text, p_data_nascimento text, p_cidade_id uuid, p_endereco text, p_leader_id uuid)
 RETURNS TABLE(contact_id uuid, verification_code text, is_already_leader boolean, is_verified boolean, needs_verification boolean, already_referred_by_other_leader boolean, original_leader_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact_id UUID;
  v_verification_code TEXT;
  v_is_verified BOOLEAN := FALSE;
  v_existing_source_type TEXT;
  v_existing_source_id UUID;
  v_original_leader_name TEXT;
BEGIN
  -- 1. Verificar se é um líder ativo (pelo telefone)
  IF EXISTS(SELECT 1 FROM lideres WHERE lideres.telefone = p_telefone_norm AND lideres.is_active = true) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, TRUE, FALSE, FALSE, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- 2. Verificar se já existe contato com este telefone ou email
  SELECT office_contacts.id, office_contacts.source_type, office_contacts.source_id::uuid, office_contacts.is_verified
  INTO v_contact_id, v_existing_source_type, v_existing_source_id, v_is_verified
  FROM office_contacts
  WHERE office_contacts.telefone_norm = p_telefone_norm
     OR (office_contacts.email IS NOT NULL AND LOWER(office_contacts.email) = LOWER(p_email))
  LIMIT 1;

  -- 3. Se já existe e JÁ É indicação de outro líder, NÃO processar - retornar aviso
  IF v_contact_id IS NOT NULL 
     AND v_existing_source_type = 'lider' 
     AND v_existing_source_id IS NOT NULL 
     AND v_existing_source_id != p_leader_id THEN
    
    -- Buscar nome do líder original
    SELECT lideres.nome_completo INTO v_original_leader_name
    FROM lideres WHERE lideres.id = v_existing_source_id;
    
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
    RETURNING office_contacts.id INTO v_contact_id;
    
    RETURN QUERY SELECT v_contact_id, v_verification_code, FALSE, FALSE, TRUE, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- 6. Se existe mas não está verificado (e é do mesmo líder ou sem líder), atualizar
  v_verification_code := generate_verification_code();
  
  UPDATE office_contacts SET
    nome = p_nome,
    email = LOWER(p_email),
    data_nascimento = CASE WHEN p_data_nascimento != '' THEN p_data_nascimento::DATE ELSE office_contacts.data_nascimento END,
    cidade_id = p_cidade_id,
    endereco = p_endereco,
    source_type = 'lider',
    source_id = p_leader_id::TEXT,
    verification_code = v_verification_code,
    updated_at = NOW()
  WHERE office_contacts.id = v_contact_id;
  
  RETURN QUERY SELECT v_contact_id, v_verification_code, FALSE, FALSE, TRUE, FALSE, NULL::TEXT;
END;
$function$;
