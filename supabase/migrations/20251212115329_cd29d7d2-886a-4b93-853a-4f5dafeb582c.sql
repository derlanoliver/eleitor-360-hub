-- Function to calculate the maximum depth of a leader's subtree
CREATE OR REPLACE FUNCTION get_subtree_max_depth(_leader_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH RECURSIVE subtree AS (
    SELECT id, 1 as depth
    FROM lideres
    WHERE id = _leader_id
    
    UNION ALL
    
    SELECT l.id, s.depth + 1
    FROM lideres l
    INNER JOIN subtree s ON l.parent_leader_id = s.id
  )
  SELECT COALESCE(MAX(depth), 1) FROM subtree;
$$;

-- Function to move a leader branch to a new parent
CREATE OR REPLACE FUNCTION move_leader_branch(
  _leader_id UUID,
  _new_parent_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _leader RECORD;
  _new_parent RECORD;
  _subtree_depth INTEGER;
  _new_level INTEGER;
  _level_diff INTEGER;
  _moved_count INTEGER;
BEGIN
  -- 1. Get the leader being moved
  SELECT id, nome_completo, parent_leader_id, hierarchy_level, is_coordinator
  INTO _leader
  FROM lideres
  WHERE id = _leader_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Líder não encontrado');
  END IF;
  
  -- 2. Cannot move coordinators
  IF _leader.is_coordinator = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coordenadores não podem ser movidos. Rebaixe-o primeiro se necessário.');
  END IF;
  
  -- 3. Get the new parent
  SELECT id, nome_completo, hierarchy_level, is_coordinator
  INTO _new_parent
  FROM lideres
  WHERE id = _new_parent_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Novo líder pai não encontrado');
  END IF;
  
  -- 4. New parent must be in a hierarchy
  IF _new_parent.hierarchy_level IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'O novo pai não faz parte de nenhuma hierarquia');
  END IF;
  
  -- 5. Prevent cycles - new parent cannot be a subordinate of the leader being moved
  IF EXISTS (
    WITH RECURSIVE subtree AS (
      SELECT id FROM lideres WHERE id = _leader_id
      UNION ALL
      SELECT l.id FROM lideres l INNER JOIN subtree s ON l.parent_leader_id = s.id
    )
    SELECT 1 FROM subtree WHERE id = _new_parent_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não é possível mover para um subordinado do próprio líder (ciclo detectado)');
  END IF;
  
  -- 6. Calculate new level
  _new_level := _new_parent.hierarchy_level + 1;
  
  -- 7. Get subtree depth
  SELECT get_subtree_max_depth(_leader_id) INTO _subtree_depth;
  
  -- 8. Check if resulting depth exceeds limit
  IF (_new_level + _subtree_depth - 1) > 4 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Movimento excederia o limite de 4 níveis de hierarquia. A sub-árvore tem profundidade ' || _subtree_depth || '.'
    );
  END IF;
  
  -- 9. Calculate level difference for updating subordinates
  _level_diff := _new_level - _leader.hierarchy_level;
  
  -- 10. Update all levels in subtree using recursive CTE
  WITH RECURSIVE subtree AS (
    SELECT id, hierarchy_level
    FROM lideres
    WHERE id = _leader_id
    
    UNION ALL
    
    SELECT l.id, l.hierarchy_level
    FROM lideres l
    INNER JOIN subtree s ON l.parent_leader_id = s.id
  )
  UPDATE lideres l
  SET hierarchy_level = l.hierarchy_level + _level_diff
  FROM subtree s
  WHERE l.id = s.id;
  
  GET DIAGNOSTICS _moved_count = ROW_COUNT;
  
  -- 11. Update the moved leader's parent
  UPDATE lideres
  SET parent_leader_id = _new_parent_id
  WHERE id = _leader_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'moved_count', _moved_count,
    'new_level', _new_level,
    'message', 'Líder e ' || (_moved_count - 1) || ' subordinado(s) movidos com sucesso'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_subtree_max_depth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_leader_branch(UUID, UUID) TO authenticated;