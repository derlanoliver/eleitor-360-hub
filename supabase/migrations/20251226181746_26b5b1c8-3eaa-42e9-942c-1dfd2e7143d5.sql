-- =====================================================
-- CORREÇÃO DEFINITIVA DO LIMITE DE HIERARQUIA
-- Centraliza o limite máximo em uma única função
-- =====================================================

-- Remover função move_leader_branch antiga para poder recriar com tipo correto
DROP FUNCTION IF EXISTS public.move_leader_branch(uuid, uuid);

-- 1. Criar função centralizada que retorna o limite máximo de hierarquia
CREATE OR REPLACE FUNCTION public.get_leader_max_depth()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 6; -- Limite máximo: 6 níveis de hierarquia
$$;

-- 2. Atualizar o trigger validate_leader_hierarchy para usar a função centralizada
CREATE OR REPLACE FUNCTION public.validate_leader_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_id UUID;
  _depth INTEGER := 0;
  _max_depth INTEGER;
BEGIN
  -- Buscar limite centralizado
  _max_depth := get_leader_max_depth();
  
  -- If no parent, no validation needed
  IF NEW.parent_leader_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check for self-reference
  IF NEW.parent_leader_id = NEW.id THEN
    RAISE EXCEPTION 'Um líder não pode ser subordinado de si mesmo';
  END IF;
  
  -- Check for cycles and max depth by traversing up
  _current_id := NEW.parent_leader_id;
  WHILE _current_id IS NOT NULL AND _depth < _max_depth + 1 LOOP
    IF _current_id = NEW.id THEN
      RAISE EXCEPTION 'Ciclo detectado na hierarquia de lideranças';
    END IF;
    
    SELECT parent_leader_id INTO _current_id
    FROM lideres WHERE id = _current_id;
    
    _depth := _depth + 1;
  END LOOP;
  
  -- Check if adding this node would exceed max depth
  IF _depth >= _max_depth THEN
    RAISE EXCEPTION 'Hierarquia máxima de % níveis atingida', _max_depth;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Atualizar set_parent_leader para usar limite centralizado
CREATE OR REPLACE FUNCTION public.set_parent_leader(_leader_id uuid, _parent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _parent_level INTEGER;
  _max_depth INTEGER;
BEGIN
  _max_depth := get_leader_max_depth();
  
  -- Get parent's level
  SELECT hierarchy_level INTO _parent_level
  FROM lideres WHERE id = _parent_id;
  
  IF _parent_level IS NULL THEN
    RAISE EXCEPTION 'O líder pai não faz parte de nenhuma hierarquia';
  END IF;
  
  IF _parent_level >= _max_depth THEN
    RAISE EXCEPTION 'Nível máximo de hierarquia atingido (máximo: % níveis)', _max_depth;
  END IF;
  
  -- Update the leader
  UPDATE lideres
  SET 
    parent_leader_id = _parent_id,
    hierarchy_level = _parent_level + 1,
    is_coordinator = false
  WHERE id = _leader_id;
  
  RETURN FOUND;
END;
$function$;

-- 4. Atualizar get_leader_tree para usar limite centralizado
CREATE OR REPLACE FUNCTION public.get_leader_tree(_leader_id uuid)
RETURNS TABLE(id uuid, nome_completo text, email text, telefone text, parent_leader_id uuid, hierarchy_level integer, depth integer, cadastros integer, pontuacao_total integer, is_active boolean, cidade_id uuid, cidade_nome text, created_at timestamp with time zone, is_coordinator boolean, is_verified boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _max_depth INTEGER;
BEGIN
  _max_depth := get_leader_max_depth();
  
  RETURN QUERY
  WITH RECURSIVE tree AS (
    SELECT 
      l.id, 
      l.nome_completo, 
      l.email,
      l.telefone,
      l.parent_leader_id, 
      l.hierarchy_level, 
      1 as depth, 
      l.cadastros, 
      l.pontuacao_total,
      l.is_active,
      l.cidade_id,
      c.nome as cidade_nome,
      l.created_at,
      l.is_coordinator,
      l.is_verified
    FROM lideres l
    LEFT JOIN office_cities c ON c.id = l.cidade_id
    WHERE l.id = _leader_id
    
    UNION ALL
    
    SELECT 
      l.id, 
      l.nome_completo, 
      l.email,
      l.telefone,
      l.parent_leader_id, 
      l.hierarchy_level, 
      t.depth + 1, 
      l.cadastros, 
      l.pontuacao_total,
      l.is_active,
      l.cidade_id,
      c.nome as cidade_nome,
      l.created_at,
      l.is_coordinator,
      l.is_verified
    FROM lideres l
    LEFT JOIN office_cities c ON c.id = l.cidade_id
    JOIN tree t ON l.parent_leader_id = t.id
    WHERE l.is_active = true AND t.depth < _max_depth + 1
  )
  SELECT * FROM tree;
END;
$function$;

-- 5. Recriar move_leader_branch com limite centralizado
CREATE OR REPLACE FUNCTION public.move_leader_branch(_leader_id uuid, _new_parent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _new_parent_level INTEGER;
  _leader_subtree_depth INTEGER;
  _max_depth INTEGER;
BEGIN
  _max_depth := get_leader_max_depth();
  
  -- Prevent moving to self or descendants
  IF _leader_id = _new_parent_id THEN
    RAISE EXCEPTION 'Não é possível mover um líder para si mesmo';
  END IF;
  
  -- Check if new parent is a descendant of the leader being moved
  IF EXISTS (
    SELECT 1 FROM get_leader_tree(_leader_id) 
    WHERE id = _new_parent_id AND id != _leader_id
  ) THEN
    RAISE EXCEPTION 'Não é possível mover um líder para um de seus subordinados';
  END IF;
  
  -- Get new parent's level
  SELECT hierarchy_level INTO _new_parent_level
  FROM lideres WHERE id = _new_parent_id;
  
  IF _new_parent_level IS NULL THEN
    RAISE EXCEPTION 'O novo líder pai não faz parte de nenhuma hierarquia';
  END IF;
  
  -- Calculate the depth of the subtree being moved
  SELECT COALESCE(MAX(depth), 1) INTO _leader_subtree_depth
  FROM get_leader_tree(_leader_id);
  
  -- Check if moving would exceed max depth
  IF (_new_parent_level + _leader_subtree_depth) > _max_depth THEN
    RAISE EXCEPTION 'Mover esta ramificação excederia o limite de % níveis de hierarquia', _max_depth;
  END IF;
  
  -- Update the leader and recalculate levels for the subtree
  WITH RECURSIVE subtree AS (
    SELECT id, 1 as relative_depth
    FROM lideres WHERE id = _leader_id
    UNION ALL
    SELECT l.id, s.relative_depth + 1
    FROM lideres l
    JOIN subtree s ON l.parent_leader_id = s.id
  )
  UPDATE lideres l
  SET hierarchy_level = _new_parent_level + s.relative_depth
  FROM subtree s
  WHERE l.id = s.id;
  
  -- Update parent reference
  UPDATE lideres
  SET parent_leader_id = _new_parent_id
  WHERE id = _leader_id;
  
  RETURN true;
END;
$function$;

-- 6. Atualizar register_leader_from_affiliate para usar limite centralizado
CREATE OR REPLACE FUNCTION public.register_leader_from_affiliate(
  p_nome_completo text,
  p_telefone text,
  p_email text,
  p_cidade_id uuid,
  p_affiliate_token text,
  p_data_nascimento date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referring_leader RECORD;
  v_new_leader_id UUID;
  v_verification_code TEXT;
  v_new_affiliate_token TEXT;
  v_normalized_phone TEXT;
  v_existing_leader RECORD;
  v_max_depth INTEGER;
BEGIN
  v_max_depth := get_leader_max_depth();
  
  -- Normalizar telefone
  v_normalized_phone := normalize_phone_e164(p_telefone);
  
  -- Buscar líder que indicou pelo affiliate_token
  SELECT id, nome_completo, hierarchy_level, is_active
  INTO v_referring_leader
  FROM lideres
  WHERE affiliate_token = p_affiliate_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_token',
      'message', 'Token de afiliado inválido'
    );
  END IF;
  
  IF NOT v_referring_leader.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'inactive_leader',
      'message', 'O líder que indicou está inativo'
    );
  END IF;
  
  -- Verificar se o líder que indica já atingiu o nível máximo
  IF v_referring_leader.hierarchy_level IS NOT NULL AND v_referring_leader.hierarchy_level >= v_max_depth THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'max_hierarchy',
      'message', 'Limite de hierarquia atingido (máximo: ' || v_max_depth || ' níveis)'
    );
  END IF;
  
  -- Verificar se já existe líder com este telefone
  SELECT id, nome_completo, is_active, is_verified
  INTO v_existing_leader
  FROM lideres
  WHERE telefone = v_normalized_phone OR telefone = p_telefone;
  
  IF FOUND THEN
    IF v_existing_leader.is_active THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_leader',
        'message', 'Este telefone já está cadastrado como liderança'
      );
    ELSE
      -- Reativar líder inativo
      UPDATE lideres
      SET 
        is_active = true,
        nome_completo = p_nome_completo,
        email = p_email,
        cidade_id = p_cidade_id,
        data_nascimento = p_data_nascimento,
        parent_leader_id = v_referring_leader.id,
        hierarchy_level = COALESCE(v_referring_leader.hierarchy_level, 0) + 1,
        updated_at = now()
      WHERE id = v_existing_leader.id;
      
      RETURN jsonb_build_object(
        'success', true,
        'leader_id', v_existing_leader.id,
        'message', 'Liderança reativada com sucesso',
        'reactivated', true
      );
    END IF;
  END IF;
  
  -- Gerar código de verificação
  v_verification_code := generate_verification_code();
  
  -- Gerar token de afiliado para o novo líder
  v_new_affiliate_token := encode(gen_random_bytes(16), 'hex');
  
  -- Inserir novo líder
  INSERT INTO lideres (
    nome_completo,
    telefone,
    email,
    cidade_id,
    data_nascimento,
    parent_leader_id,
    hierarchy_level,
    is_active,
    is_verified,
    verification_code,
    affiliate_token
  ) VALUES (
    p_nome_completo,
    v_normalized_phone,
    p_email,
    p_cidade_id,
    p_data_nascimento,
    v_referring_leader.id,
    COALESCE(v_referring_leader.hierarchy_level, 0) + 1,
    true,
    false,
    v_verification_code,
    v_new_affiliate_token
  )
  RETURNING id INTO v_new_leader_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'leader_id', v_new_leader_id,
    'verification_code', v_verification_code,
    'message', 'Liderança cadastrada com sucesso',
    'referring_leader_name', v_referring_leader.nome_completo
  );
END;
$function$;

-- 7. Atualizar get_leader_by_token_v2 para usar limite centralizado
CREATE OR REPLACE FUNCTION public.get_leader_by_token_v2(_token text)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  cidade_id uuid,
  cidade_nome text,
  hierarchy_level integer,
  can_register_subordinates boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _max_depth INTEGER;
BEGIN
  _max_depth := get_leader_max_depth();
  
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.cidade_id,
    c.nome as cidade_nome,
    l.hierarchy_level,
    (l.hierarchy_level IS NULL OR l.hierarchy_level < _max_depth) as can_register_subordinates
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  WHERE l.affiliate_token = _token
    AND l.is_active = true;
END;
$function$;

-- 8. Atualizar get_leader_by_token_v3 para usar limite centralizado
CREATE OR REPLACE FUNCTION public.get_leader_by_token_v3(_token text)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  cidade_id uuid,
  cidade_nome text,
  hierarchy_level integer,
  can_register_subordinates boolean,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _max_depth INTEGER;
BEGIN
  _max_depth := get_leader_max_depth();
  
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.cidade_id,
    c.nome as cidade_nome,
    l.hierarchy_level,
    (l.hierarchy_level IS NULL OR l.hierarchy_level < _max_depth) as can_register_subordinates,
    l.is_verified
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  WHERE l.affiliate_token = _token
    AND l.is_active = true;
END;
$function$;

-- 9. Criar/atualizar create_leader_from_public_form para usar limite centralizado
CREATE OR REPLACE FUNCTION public.create_leader_from_public_form(
  p_nome_completo text,
  p_telefone text,
  p_email text,
  p_cidade_id uuid,
  p_data_nascimento date DEFAULT NULL,
  p_parent_leader_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_leader_id UUID;
  v_verification_code TEXT;
  v_new_affiliate_token TEXT;
  v_normalized_phone TEXT;
  v_existing_leader RECORD;
  v_parent_level INTEGER;
  v_max_depth INTEGER;
BEGIN
  v_max_depth := get_leader_max_depth();
  
  -- Normalizar telefone
  v_normalized_phone := normalize_phone_e164(p_telefone);
  
  -- Verificar nível do pai se fornecido
  IF p_parent_leader_id IS NOT NULL THEN
    SELECT hierarchy_level INTO v_parent_level
    FROM lideres WHERE id = p_parent_leader_id AND is_active = true;
    
    IF v_parent_level IS NOT NULL AND v_parent_level >= v_max_depth THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'max_hierarchy',
        'message', 'Limite de hierarquia atingido (máximo: ' || v_max_depth || ' níveis)'
      );
    END IF;
  END IF;
  
  -- Verificar se já existe líder com este telefone
  SELECT id, nome_completo, is_active
  INTO v_existing_leader
  FROM lideres
  WHERE telefone = v_normalized_phone OR telefone = p_telefone;
  
  IF FOUND THEN
    IF v_existing_leader.is_active THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_leader',
        'message', 'Este telefone já está cadastrado como liderança'
      );
    END IF;
  END IF;
  
  -- Gerar código de verificação
  v_verification_code := generate_verification_code();
  
  -- Gerar token de afiliado
  v_new_affiliate_token := encode(gen_random_bytes(16), 'hex');
  
  -- Inserir novo líder
  INSERT INTO lideres (
    nome_completo,
    telefone,
    email,
    cidade_id,
    data_nascimento,
    parent_leader_id,
    hierarchy_level,
    is_active,
    is_verified,
    verification_code,
    affiliate_token
  ) VALUES (
    p_nome_completo,
    v_normalized_phone,
    p_email,
    p_cidade_id,
    p_data_nascimento,
    p_parent_leader_id,
    CASE WHEN p_parent_leader_id IS NOT NULL THEN COALESCE(v_parent_level, 0) + 1 ELSE NULL END,
    true,
    false,
    v_verification_code,
    v_new_affiliate_token
  )
  RETURNING id INTO v_new_leader_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'leader_id', v_new_leader_id,
    'verification_code', v_verification_code,
    'affiliate_token', v_new_affiliate_token,
    'message', 'Liderança cadastrada com sucesso'
  );
END;
$function$;