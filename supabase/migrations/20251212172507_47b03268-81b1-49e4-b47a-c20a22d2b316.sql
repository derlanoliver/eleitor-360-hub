-- Function to promote a leader to coordinator with all subordinates
CREATE OR REPLACE FUNCTION promote_to_coordinator_with_subordinates(_leader_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old_level INTEGER;
  _level_diff INTEGER;
  _subordinate_count INTEGER;
BEGIN
  -- Get current leader level
  SELECT hierarchy_level INTO _old_level
  FROM lideres WHERE id = _leader_id;
  
  IF _old_level IS NULL OR _old_level = 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Líder já é coordenador ou não está em uma hierarquia');
  END IF;
  
  -- Calculate level difference for subordinate adjustment
  _level_diff := _old_level - 1;
  
  -- Count subordinates before update
  WITH RECURSIVE subordinates AS (
    SELECT id FROM lideres WHERE parent_leader_id = _leader_id
    UNION ALL
    SELECT l.id FROM lideres l
    INNER JOIN subordinates s ON l.parent_leader_id = s.id
  )
  SELECT COUNT(*) INTO _subordinate_count FROM subordinates;
  
  -- Promote the leader to coordinator
  UPDATE lideres
  SET 
    is_coordinator = true,
    hierarchy_level = 1,
    parent_leader_id = NULL
  WHERE id = _leader_id;
  
  -- Update all subordinates recursively (adjust their levels)
  WITH RECURSIVE subordinates AS (
    SELECT id FROM lideres WHERE parent_leader_id = _leader_id
    UNION ALL
    SELECT l.id FROM lideres l
    INNER JOIN subordinates s ON l.parent_leader_id = s.id
  )
  UPDATE lideres
  SET hierarchy_level = hierarchy_level - _level_diff
  WHERE id IN (SELECT id FROM subordinates);
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Líder promovido a coordenador com ' || _subordinate_count || ' subordinado(s)',
    'subordinates_moved', _subordinate_count
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION promote_to_coordinator_with_subordinates(uuid) TO authenticated;