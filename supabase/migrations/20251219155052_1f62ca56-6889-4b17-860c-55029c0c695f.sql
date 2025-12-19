DROP FUNCTION IF EXISTS get_leader_tree(uuid);

CREATE OR REPLACE FUNCTION get_leader_tree(_leader_id uuid)
RETURNS TABLE (
  id uuid,
  nome_completo text,
  email text,
  telefone text,
  parent_leader_id uuid,
  hierarchy_level integer,
  depth integer,
  cadastros integer,
  pontuacao_total integer,
  is_active boolean,
  cidade_id uuid,
  cidade_nome text,
  created_at timestamptz,
  is_coordinator boolean,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
      oc.nome as cidade_nome,
      l.created_at,
      l.is_coordinator,
      l.is_verified
    FROM lideres l 
    LEFT JOIN office_cities oc ON oc.id = l.cidade_id
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
      oc.nome as cidade_nome,
      l.created_at,
      l.is_coordinator,
      l.is_verified
    FROM lideres l 
    LEFT JOIN office_cities oc ON oc.id = l.cidade_id
    INNER JOIN tree t ON l.parent_leader_id = t.id
    WHERE t.depth < 5
  )
  SELECT * FROM tree;
END;
$$;