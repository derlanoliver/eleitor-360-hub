-- Function to get coordinators with unverified leader counts in their tree
CREATE OR REPLACE FUNCTION get_coordinators_with_unverified_count(search_term TEXT DEFAULT '')
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  total_in_tree BIGINT,
  unverified_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH RECURSIVE leader_tree AS (
    -- Coordenadores (raiz)
    SELECT l.id, l.nome_completo, l.email, l.is_verified, l.id as coordinator_id, 0 as level
    FROM lideres l
    WHERE l.is_coordinator = true AND l.is_active = true
    
    UNION ALL
    
    -- Subordinados recursivos
    SELECT sub.id, sub.nome_completo, sub.email, sub.is_verified, lt.coordinator_id, lt.level + 1
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT 
    c.id,
    c.nome_completo,
    COUNT(*) FILTER (WHERE lt.level > 0) as total_in_tree,
    COUNT(*) FILTER (WHERE lt.level > 0 AND (lt.is_verified = false OR lt.is_verified IS NULL) AND lt.email IS NOT NULL AND lt.email != '') as unverified_count
  FROM lideres c
  LEFT JOIN leader_tree lt ON lt.coordinator_id = c.id
  WHERE c.is_coordinator = true 
    AND c.is_active = true
    AND (search_term = '' OR c.nome_completo ILIKE '%' || search_term || '%')
  GROUP BY c.id, c.nome_completo
  HAVING COUNT(*) FILTER (WHERE lt.level > 0 AND (lt.is_verified = false OR lt.is_verified IS NULL) AND lt.email IS NOT NULL AND lt.email != '') > 0
  ORDER BY c.nome_completo
  LIMIT 20;
$$;

-- Function to get unverified leaders in a coordinator's tree
CREATE OR REPLACE FUNCTION get_unverified_leaders_in_tree(coordinator_id UUID)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  email TEXT,
  verification_code TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH RECURSIVE leader_tree AS (
    -- Coordenador (raiz)
    SELECT l.id, l.nome_completo, l.email, l.verification_code, l.is_verified
    FROM lideres l
    WHERE l.id = coordinator_id AND l.is_active = true
    
    UNION ALL
    
    -- Subordinados recursivos
    SELECT sub.id, sub.nome_completo, sub.email, sub.verification_code, sub.is_verified
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT lt.id, lt.nome_completo, lt.email, lt.verification_code
  FROM leader_tree lt
  WHERE (lt.is_verified = false OR lt.is_verified IS NULL)
    AND lt.email IS NOT NULL 
    AND lt.email != ''
    AND lt.id != coordinator_id
  ORDER BY lt.nome_completo;
$$;