-- Função para registrar novo líder diretamente via link de afiliado
CREATE OR REPLACE FUNCTION public.register_leader_from_affiliate(
  p_nome TEXT,
  p_email TEXT,
  p_telefone_norm TEXT,
  p_data_nascimento TEXT,
  p_cidade_id UUID,
  p_endereco TEXT,
  p_referring_leader_id UUID
)
RETURNS TABLE(
  leader_id UUID,
  affiliate_token TEXT,
  is_already_leader BOOLEAN,
  already_referred_by_other_leader BOOLEAN,
  original_leader_name TEXT,
  hierarchy_level_exceeded BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_leader_id UUID;
  v_existing_referred_leader_id UUID;
  v_existing_parent_leader_id UUID;
  v_referring_leader_level INTEGER;
  v_new_leader_id UUID;
  v_new_affiliate_token TEXT;
  v_original_leader_name TEXT;
BEGIN
  -- 1. Verificar se já é um líder ativo (por telefone)
  SELECT id INTO v_existing_leader_id
  FROM lideres
  WHERE telefone = p_telefone_norm AND is_active = true
  LIMIT 1;
  
  IF v_existing_leader_id IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_existing_leader_id,
      (SELECT lideres.affiliate_token FROM lideres WHERE lideres.id = v_existing_leader_id),
      TRUE,
      FALSE,
      NULL::TEXT,
      FALSE;
    RETURN;
  END IF;
  
  -- 2. Verificar se já existe um líder com este telefone cadastrado por OUTRO líder
  SELECT l.id, l.parent_leader_id INTO v_existing_referred_leader_id, v_existing_parent_leader_id
  FROM lideres l
  WHERE l.telefone = p_telefone_norm
  LIMIT 1;
  
  IF v_existing_referred_leader_id IS NOT NULL AND v_existing_parent_leader_id IS NOT NULL AND v_existing_parent_leader_id != p_referring_leader_id THEN
    SELECT nome_completo INTO v_original_leader_name
    FROM lideres WHERE id = v_existing_parent_leader_id;
    
    RETURN QUERY SELECT 
      NULL::UUID,
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
      (SELECT lideres.affiliate_token FROM lideres WHERE lideres.id = v_existing_referred_leader_id),
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
  
  -- 4. Validar se pode adicionar mais um nível (máximo 4)
  IF v_referring_leader_level >= 4 THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      FALSE,
      FALSE,
      NULL::TEXT,
      TRUE;
    RETURN;
  END IF;
  
  -- 5. Criar novo líder
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
    cadastros
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
    0
  )
  RETURNING id, lideres.affiliate_token INTO v_new_leader_id, v_new_affiliate_token;
  
  -- 6. Pontuar o líder indicador (+1 ponto por indicar novo líder)
  PERFORM award_leader_points(p_referring_leader_id, 1, 'indicacao_lider');
  
  -- 7. Retornar dados do novo líder
  RETURN QUERY SELECT 
    v_new_leader_id,
    v_new_affiliate_token,
    FALSE,
    FALSE,
    NULL::TEXT,
    FALSE;
END;
$$;

-- Dar permissão de execução para usuários públicos
GRANT EXECUTE ON FUNCTION public.register_leader_from_affiliate TO anon;
GRANT EXECUTE ON FUNCTION public.register_leader_from_affiliate TO authenticated;