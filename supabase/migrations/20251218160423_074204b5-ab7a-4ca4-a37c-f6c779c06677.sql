
DROP FUNCTION IF EXISTS get_leader_tree(UUID);

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
  cidade_id UUID,
  created_at TIMESTAMPTZ,
  is_coordinator BOOLEAN
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH RECURSIVE tree AS (
  SELECT 
    l.id, l.nome_completo, l.email, l.telefone,
    l.parent_leader_id, l.hierarchy_level, 
    1 as depth, l.cadastros, l.pontuacao_total,
    l.is_active, l.cidade_id,
    l.created_at,
    l.is_coordinator
  FROM lideres l 
  WHERE l.id = _leader_id
  
  UNION ALL
  
  SELECT 
    l.id, l.nome_completo, l.email, l.telefone,
    l.parent_leader_id, l.hierarchy_level, 
    t.depth + 1, l.cadastros, l.pontuacao_total,
    l.is_active, l.cidade_id,
    l.created_at,
    l.is_coordinator
  FROM lideres l 
  INNER JOIN tree t ON l.parent_leader_id = t.id
  WHERE t.depth < 5
)
SELECT * FROM tree;
$$;
