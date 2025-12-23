-- Atualizar função create_leader_from_public_form para suportar 6 níveis
CREATE OR REPLACE FUNCTION public.create_leader_from_public_form(
  p_nome_completo text,
  p_email text,
  p_telefone text,
  p_cidade_id uuid,
  p_data_nascimento date DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_referring_leader_token text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_leader_id uuid;
  v_referring_leader_id uuid;
  v_referring_leader_level int;
  v_new_leader_level int;
BEGIN
  -- Check for referring leader by token
  IF p_referring_leader_token IS NOT NULL AND p_referring_leader_token != '' THEN
    SELECT id, hierarchy_level INTO v_referring_leader_id, v_referring_leader_level
    FROM lideres
    WHERE affiliate_token = p_referring_leader_token
    AND is_active = true;
    
    IF v_referring_leader_id IS NOT NULL THEN
      -- Check if adding new leader would exceed 6 levels (MUDANÇA: era 4, agora é 6)
      IF v_referring_leader_level >= 6 THEN
        RAISE EXCEPTION 'Limite de hierarquia atingido. Não é possível adicionar mais níveis.';
      END IF;
      v_new_leader_level := v_referring_leader_level + 1;
    END IF;
  END IF;

  -- Insert new leader
  INSERT INTO lideres (
    nome_completo,
    email,
    telefone,
    cidade_id,
    data_nascimento,
    observacao,
    parent_leader_id,
    hierarchy_level,
    is_active,
    status
  ) VALUES (
    p_nome_completo,
    p_email,
    p_telefone,
    p_cidade_id,
    p_data_nascimento,
    p_observacao,
    v_referring_leader_id,
    v_new_leader_level,
    true,
    'active'
  )
  RETURNING id INTO v_new_leader_id;
  
  -- Update referring leader's cadastros count
  IF v_referring_leader_id IS NOT NULL THEN
    UPDATE lideres 
    SET cadastros = cadastros + 1,
        last_activity = now()
    WHERE id = v_referring_leader_id;
  END IF;
  
  RETURN v_new_leader_id;
END;
$$;

-- Atualizar função promote_leader_to_subordinate para suportar 6 níveis
CREATE OR REPLACE FUNCTION public.promote_leader_to_subordinate(
  _leader_id uuid,
  _parent_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _parent_level int;
  _new_level int;
BEGIN
  -- Get parent's level
  SELECT hierarchy_level INTO _parent_level
  FROM lideres
  WHERE id = _parent_id;
  
  IF _parent_level IS NULL THEN
    RAISE EXCEPTION 'Líder pai não encontrado ou não está em uma hierarquia';
  END IF;
  
  -- Check if we can add a new level (MUDANÇA: era 4, agora é 6)
  IF _parent_level >= 6 THEN
    RAISE EXCEPTION 'Limite de hierarquia atingido. Não é possível adicionar mais níveis.';
  END IF;
  
  _new_level := _parent_level + 1;
  
  -- Update the leader
  UPDATE lideres
  SET parent_leader_id = _parent_id,
      hierarchy_level = _new_level,
      is_coordinator = false,
      updated_at = now()
  WHERE id = _leader_id;
  
  -- Update parent's cadastros
  UPDATE lideres
  SET cadastros = cadastros + 1,
      last_activity = now()
  WHERE id = _parent_id;
END;
$$;