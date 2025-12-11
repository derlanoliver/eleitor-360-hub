-- Add hierarchy fields to lideres table
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS parent_leader_id UUID REFERENCES lideres(id) ON DELETE SET NULL;
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT NULL;
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS is_coordinator BOOLEAN DEFAULT false;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_lideres_parent ON lideres(parent_leader_id);
CREATE INDEX IF NOT EXISTS idx_lideres_coordinator ON lideres(is_coordinator) WHERE is_coordinator = true;
CREATE INDEX IF NOT EXISTS idx_lideres_hierarchy_level ON lideres(hierarchy_level) WHERE hierarchy_level IS NOT NULL;

-- Function to get leader tree recursively
CREATE OR REPLACE FUNCTION get_leader_tree(_leader_id UUID)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  email TEXT,
  telefone TEXT,
  parent_leader_id UUID,
  hierarchy_level INTEGER,
  depth INTEGER,
  cadastros INTEGER,
  pontuacao_total INTEGER,
  is_active BOOLEAN,
  cidade_id UUID
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    l.cidade_id
  FROM lideres l 
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
    l.cidade_id
  FROM lideres l 
  INNER JOIN tree t ON l.parent_leader_id = t.id
  WHERE t.depth < 5
)
SELECT * FROM tree;
$$;

-- Function to get coordinator network stats
CREATE OR REPLACE FUNCTION get_coordinator_network_stats(_coordinator_id UUID)
RETURNS TABLE (
  total_leaders INTEGER,
  total_cadastros INTEGER,
  total_pontos INTEGER
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (COUNT(*)::INTEGER - 1) as total_leaders,
    COALESCE(SUM(cadastros), 0)::INTEGER as total_cadastros,
    COALESCE(SUM(pontuacao_total), 0)::INTEGER as total_pontos
  FROM get_leader_tree(_coordinator_id);
$$;

-- Function to validate hierarchy (prevent cycles and enforce max depth)
CREATE OR REPLACE FUNCTION validate_leader_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_id UUID;
  _depth INTEGER := 0;
  _max_depth INTEGER := 4;
BEGIN
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
$$;

-- Create trigger for hierarchy validation
DROP TRIGGER IF EXISTS validate_leader_hierarchy_trigger ON lideres;
CREATE TRIGGER validate_leader_hierarchy_trigger
  BEFORE INSERT OR UPDATE OF parent_leader_id ON lideres
  FOR EACH ROW
  EXECUTE FUNCTION validate_leader_hierarchy();

-- Function to promote leader to coordinator
CREATE OR REPLACE FUNCTION promote_to_coordinator(_leader_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lideres
  SET 
    is_coordinator = true,
    hierarchy_level = 1,
    parent_leader_id = NULL
  WHERE id = _leader_id;
  
  RETURN FOUND;
END;
$$;

-- Function to demote coordinator back to regular leader
CREATE OR REPLACE FUNCTION demote_coordinator(_leader_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First, unlink all direct subordinates
  UPDATE lideres
  SET parent_leader_id = NULL, hierarchy_level = NULL
  WHERE parent_leader_id = _leader_id;
  
  -- Then demote the coordinator
  UPDATE lideres
  SET 
    is_coordinator = false,
    hierarchy_level = NULL,
    parent_leader_id = NULL
  WHERE id = _leader_id;
  
  RETURN FOUND;
END;
$$;

-- Function to set parent leader with automatic level calculation
CREATE OR REPLACE FUNCTION set_parent_leader(_leader_id UUID, _parent_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _parent_level INTEGER;
BEGIN
  -- Get parent's level
  SELECT hierarchy_level INTO _parent_level
  FROM lideres WHERE id = _parent_id;
  
  IF _parent_level IS NULL THEN
    RAISE EXCEPTION 'O líder pai não faz parte de nenhuma hierarquia';
  END IF;
  
  IF _parent_level >= 4 THEN
    RAISE EXCEPTION 'Nível máximo de hierarquia atingido';
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
$$;

-- Function to remove leader from tree
CREATE OR REPLACE FUNCTION remove_from_tree(_leader_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reassign subordinates to the removed leader's parent
  UPDATE lideres
  SET parent_leader_id = (SELECT parent_leader_id FROM lideres WHERE id = _leader_id)
  WHERE parent_leader_id = _leader_id;
  
  -- Remove from tree
  UPDATE lideres
  SET 
    parent_leader_id = NULL,
    hierarchy_level = NULL,
    is_coordinator = false
  WHERE id = _leader_id;
  
  RETURN FOUND;
END;
$$;