-- Primeiro dropar a função existente que tem assinatura diferente
DROP FUNCTION IF EXISTS public.public_get_leader_for_resend(uuid);

-- Corrigir a função public_create_leader_self_registration para NUNCA regenerar código se já existir
CREATE OR REPLACE FUNCTION public.public_create_leader_self_registration(
  p_nome text,
  p_telefone text,
  p_email text DEFAULT NULL,
  p_cidade_id uuid DEFAULT NULL,
  p_data_nascimento date DEFAULT NULL,
  p_observacao text DEFAULT NULL
)
RETURNS TABLE(
  leader_id uuid,
  verification_code text,
  already_exists boolean,
  existing_is_verified boolean,
  affiliate_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_phone text;
  v_existing_leader record;
  v_new_leader_id uuid;
  v_new_verification_code text;
  v_new_affiliate_token text;
BEGIN
  -- Normalizar telefone
  v_normalized_phone := regexp_replace(p_telefone, '[^0-9]', '', 'g');
  IF length(v_normalized_phone) = 11 THEN
    v_normalized_phone := '+55' || v_normalized_phone;
  ELSIF length(v_normalized_phone) = 10 THEN
    v_normalized_phone := '+55' || v_normalized_phone;
  ELSIF NOT v_normalized_phone LIKE '+%' THEN
    v_normalized_phone := '+' || v_normalized_phone;
  END IF;

  -- Verificar se já existe líder com este telefone
  SELECT l.id, l.is_verified, l.verification_code, l.affiliate_token
  INTO v_existing_leader
  FROM lideres l
  WHERE l.telefone = v_normalized_phone
    AND l.is_active = true
  LIMIT 1;

  IF v_existing_leader.id IS NOT NULL THEN
    -- Já existe - NUNCA regenerar código, apenas retornar o existente
    -- Se por algum motivo o código for null, gerar um novo
    IF v_existing_leader.verification_code IS NULL THEN
      v_new_verification_code := generate_leader_verification_code();
      UPDATE lideres 
      SET verification_code = v_new_verification_code,
          updated_at = now()
      WHERE id = v_existing_leader.id;
    ELSE
      v_new_verification_code := v_existing_leader.verification_code;
    END IF;
    
    RETURN QUERY SELECT 
      v_existing_leader.id,
      v_new_verification_code,
      true::boolean,
      COALESCE(v_existing_leader.is_verified, false),
      v_existing_leader.affiliate_token;
    RETURN;
  END IF;

  -- Gerar código e token para novo líder
  v_new_verification_code := generate_leader_verification_code();
  v_new_affiliate_token := encode(gen_random_bytes(16), 'hex');

  -- Inserir novo líder
  INSERT INTO lideres (
    nome_completo,
    telefone,
    email,
    cidade_id,
    data_nascimento,
    observacao,
    is_active,
    is_verified,
    verification_code,
    affiliate_token,
    hierarchy_level
  ) VALUES (
    p_nome,
    v_normalized_phone,
    p_email,
    p_cidade_id,
    p_data_nascimento,
    p_observacao,
    true,
    false,
    v_new_verification_code,
    v_new_affiliate_token,
    1
  )
  RETURNING id INTO v_new_leader_id;

  RETURN QUERY SELECT 
    v_new_leader_id,
    v_new_verification_code,
    false::boolean,
    false::boolean,
    v_new_affiliate_token;
END;
$$;

-- Recriar a função public_get_leader_for_resend com a mesma assinatura que o frontend espera
CREATE OR REPLACE FUNCTION public.public_get_leader_for_resend(p_leader_id uuid)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  telefone text,
  verification_code text,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader record;
  v_new_code text;
BEGIN
  -- Buscar líder
  SELECT l.id, l.nome_completo, l.telefone, l.verification_code, l.is_verified
  INTO v_leader
  FROM lideres l
  WHERE l.id = p_leader_id
    AND l.is_active = true;

  IF v_leader.id IS NULL THEN
    RETURN;
  END IF;

  -- Se não tiver código, gerar um novo (único caso onde geramos)
  IF v_leader.verification_code IS NULL THEN
    v_new_code := generate_leader_verification_code();
    UPDATE lideres 
    SET verification_code = v_new_code,
        updated_at = now()
    WHERE lideres.id = p_leader_id;
    
    v_leader.verification_code := v_new_code;
  END IF;

  RETURN QUERY SELECT 
    v_leader.id,
    v_leader.nome_completo,
    v_leader.telefone,
    v_leader.verification_code,
    v_leader.is_verified;
END;
$$;

-- Adicionar comentário na função de regenerar código
COMMENT ON FUNCTION public.public_regenerate_leader_verification_code IS 
'ATENÇÃO: Esta função regenera o código de verificação. 
Só deve ser usada quando o usuário solicita EXPLICITAMENTE uma troca de código por segurança.
NUNCA usar para reenvio de SMS - o código existente deve ser mantido.';