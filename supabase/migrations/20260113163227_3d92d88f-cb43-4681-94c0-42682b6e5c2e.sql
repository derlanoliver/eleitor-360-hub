-- RPC 1: Buscar líder por telefone ou email (para verificar duplicidade)
CREATE OR REPLACE FUNCTION public.public_find_leader_by_phone_or_email(
  p_phone text,
  p_email text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  nome_completo text,
  telefone text,
  email text,
  is_verified boolean,
  is_active boolean,
  verification_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.telefone,
    l.email,
    COALESCE(l.is_verified, false) as is_verified,
    l.is_active,
    l.verification_code
  FROM lideres l
  WHERE l.is_active = true
    AND (
      l.telefone = p_phone
      OR (p_email IS NOT NULL AND p_email != '' AND LOWER(l.email) = LOWER(p_email))
    )
  LIMIT 1;
END;
$$;

-- RPC 2: Criar líder via auto-cadastro público
CREATE OR REPLACE FUNCTION public.public_create_leader_self_registration(
  p_nome text,
  p_telefone text,
  p_email text DEFAULT NULL,
  p_cidade_id uuid DEFAULT NULL,
  p_data_nascimento text DEFAULT NULL,
  p_observacao text DEFAULT NULL
)
RETURNS TABLE (
  leader_id uuid,
  verification_code text,
  already_exists boolean,
  existing_is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_leader RECORD;
  v_new_leader_id uuid;
  v_verification_code text;
BEGIN
  -- Verificar se já existe líder com mesmo telefone ou email
  SELECT 
    l.id,
    COALESCE(l.is_verified, false) as is_verified,
    l.verification_code
  INTO v_existing_leader
  FROM lideres l
  WHERE l.is_active = true
    AND (
      l.telefone = p_telefone
      OR (p_email IS NOT NULL AND p_email != '' AND LOWER(l.email) = LOWER(p_email))
    )
  LIMIT 1;

  -- Se já existe, retornar informação
  IF v_existing_leader.id IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_existing_leader.id,
      v_existing_leader.verification_code,
      true::boolean,
      v_existing_leader.is_verified;
    RETURN;
  END IF;

  -- Gerar código de verificação
  v_verification_code := generate_leader_verification_code();

  -- Inserir novo líder
  INSERT INTO lideres (
    nome_completo,
    telefone,
    email,
    cidade_id,
    data_nascimento,
    observacao,
    is_active,
    status,
    cadastros,
    pontuacao_total,
    is_verified,
    verification_code
  ) VALUES (
    p_nome,
    p_telefone,
    NULLIF(TRIM(p_email), ''),
    p_cidade_id,
    CASE WHEN p_data_nascimento IS NOT NULL AND p_data_nascimento != '' 
         THEN p_data_nascimento::date 
         ELSE NULL 
    END,
    NULLIF(TRIM(p_observacao), ''),
    true,
    'active',
    0,
    0,
    false,
    v_verification_code
  )
  RETURNING id INTO v_new_leader_id;

  -- Retornar dados do novo líder
  RETURN QUERY SELECT 
    v_new_leader_id,
    v_verification_code,
    false::boolean,
    false::boolean;
END;
$$;

-- RPC 3: Buscar líder para reenvio de verificação
CREATE OR REPLACE FUNCTION public.public_get_leader_for_resend(p_leader_id uuid)
RETURNS TABLE (
  id uuid,
  nome_completo text,
  telefone text,
  email text,
  is_verified boolean,
  is_active boolean,
  verification_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.telefone,
    l.email,
    COALESCE(l.is_verified, false) as is_verified,
    l.is_active,
    l.verification_code
  FROM lideres l
  WHERE l.id = p_leader_id
    AND l.is_active = true
  LIMIT 1;
END;
$$;

-- RPC 4: Regenerar código de verificação
CREATE OR REPLACE FUNCTION public.public_regenerate_leader_verification_code(p_leader_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_code text;
BEGIN
  -- Gerar novo código
  v_new_code := generate_leader_verification_code();
  
  -- Atualizar o líder
  UPDATE lideres
  SET verification_code = v_new_code,
      updated_at = now()
  WHERE id = p_leader_id
    AND is_active = true;
  
  RETURN v_new_code;
END;
$$;

-- Conceder permissões para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.public_find_leader_by_phone_or_email(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_create_leader_self_registration(text, text, text, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_leader_for_resend(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_regenerate_leader_verification_code(uuid) TO anon, authenticated;