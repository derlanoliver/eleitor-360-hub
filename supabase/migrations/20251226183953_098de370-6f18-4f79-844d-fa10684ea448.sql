-- Fix hierarchy limit in the TABLE-returning overload used by LeaderRegistrationForm
-- This replaces the hardcoded ">= 4" check with a centralized max depth from get_leader_max_depth().

CREATE OR REPLACE FUNCTION public.register_leader_from_affiliate(
  p_nome text,
  p_email text,
  p_telefone_norm text,
  p_data_nascimento text,
  p_cidade_id uuid,
  p_endereco text,
  p_referring_leader_id uuid
)
RETURNS TABLE(
  leader_id uuid,
  affiliate_token text,
  verification_code text,
  is_already_leader boolean,
  already_referred_by_other_leader boolean,
  original_leader_name text,
  hierarchy_level_exceeded boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_leader_id UUID;
  v_existing_referred_leader_id UUID;
  v_existing_parent_leader_id UUID;
  v_referring_leader_level INTEGER;
  v_new_leader_id UUID;
  v_new_affiliate_token TEXT;
  v_new_verification_code TEXT;
  v_original_leader_name TEXT;
  v_max_depth INTEGER;
BEGIN
  v_max_depth := get_leader_max_depth();

  -- 1. Verificar se já é um líder ativo (por telefone)
  SELECT id INTO v_existing_leader_id
  FROM lideres
  WHERE telefone = p_telefone_norm AND is_active = true
  LIMIT 1;

  IF v_existing_leader_id IS NOT NULL THEN
    RETURN QUERY SELECT
      v_existing_leader_id,
      (SELECT l.affiliate_token FROM lideres l WHERE l.id = v_existing_leader_id),
      NULL::TEXT,
      TRUE,
      FALSE,
      NULL::TEXT,
      FALSE;
    RETURN;
  END IF;

  -- 2. Verificar se já existe um líder com este telefone cadastrado por OUTRO líder
  SELECT l.id, l.parent_leader_id
  INTO v_existing_referred_leader_id, v_existing_parent_leader_id
  FROM lideres l
  WHERE l.telefone = p_telefone_norm
  LIMIT 1;

  IF v_existing_referred_leader_id IS NOT NULL
     AND v_existing_parent_leader_id IS NOT NULL
     AND v_existing_parent_leader_id != p_referring_leader_id THEN

    SELECT nome_completo INTO v_original_leader_name
    FROM lideres WHERE id = v_existing_parent_leader_id;

    RETURN QUERY SELECT
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      TRUE,
      v_original_leader_name,
      FALSE;
    RETURN;
  END IF;

  -- Se já existe como líder do mesmo indicador, retornar como já é líder
  IF v_existing_referred_leader_id IS NOT NULL THEN
    RETURN QUERY SELECT
      v_existing_referred_leader_id,
      (SELECT l.affiliate_token FROM lideres l WHERE l.id = v_existing_referred_leader_id),
      NULL::TEXT,
      TRUE,
      FALSE,
      NULL::TEXT,
      FALSE;
    RETURN;
  END IF;

  -- 3. Buscar hierarchy_level do líder indicador
  SELECT hierarchy_level INTO v_referring_leader_level
  FROM lideres
  WHERE id = p_referring_leader_id AND is_active = true;

  -- Se o líder indicador não tem hierarchy_level definido, considerar como nível 1 (coordenador)
  IF v_referring_leader_level IS NULL THEN
    v_referring_leader_level := 1;
  END IF;

  -- 4. Validar se pode adicionar mais um nível (máximo configurado)
  IF v_referring_leader_level >= v_max_depth THEN
    RETURN QUERY SELECT
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      FALSE,
      NULL::TEXT,
      TRUE;
    RETURN;
  END IF;

  -- 5. Gerar código de verificação
  v_new_verification_code := generate_leader_verification_code();

  -- 6. Criar novo líder com is_verified = false
  INSERT INTO lideres (
    nome_completo,
    email,
    telefone,
    data_nascimento,
    cidade_id,
    observacao,
    parent_leader_id,
    hierarchy_level,
    is_coordinator,
    is_active,
    status,
    pontuacao_total,
    cadastros,
    is_verified,
    verification_code
  ) VALUES (
    p_nome,
    LOWER(p_email),
    p_telefone_norm,
    CASE WHEN p_data_nascimento != '' THEN p_data_nascimento::DATE ELSE NULL END,
    p_cidade_id,
    'Endereço: ' || p_endereco,
    p_referring_leader_id,
    v_referring_leader_level + 1,
    FALSE,
    TRUE,
    'active',
    0,
    0,
    FALSE,
    v_new_verification_code
  )
  RETURNING id, lideres.affiliate_token INTO v_new_leader_id, v_new_affiliate_token;

  -- 7. Pontuar o líder indicador (+1 ponto por indicar novo líder)
  PERFORM award_leader_points(p_referring_leader_id, 1, 'indicacao_lider');

  -- 8. Retornar dados do novo líder (incluindo verification_code)
  RETURN QUERY SELECT
    v_new_leader_id,
    v_new_affiliate_token,
    v_new_verification_code,
    FALSE,
    FALSE,
    NULL::TEXT,
    FALSE;
END;
$function$;
