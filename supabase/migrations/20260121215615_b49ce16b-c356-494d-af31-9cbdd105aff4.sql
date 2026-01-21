-- Atualizar função para incluir TODOS os líderes com subordinados (não apenas coordenadores)
CREATE OR REPLACE FUNCTION get_coordinators_with_unverified_count_sms(search_term text DEFAULT '')
RETURNS TABLE(
  id uuid,
  nome_completo text,
  total_in_tree bigint,
  unverified_count bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE leader_tree AS (
    -- Base: TODOS os líderes ativos (não apenas coordenadores)
    SELECT l.id, l.nome_completo, l.telefone, l.is_verified, l.id as root_leader_id, 0 as level
    FROM lideres l
    WHERE l.is_active = true
    
    UNION ALL
    
    -- Recursão: subordinados ativos
    SELECT sub.id, sub.nome_completo, sub.telefone, sub.is_verified, lt.root_leader_id, lt.level + 1
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT 
    l.id,
    l.nome_completo,
    COUNT(*) FILTER (WHERE lt.level > 0) as total_in_tree,
    COUNT(*) FILTER (
      WHERE lt.level > 0 
      AND (lt.is_verified = false OR lt.is_verified IS NULL) 
      AND lt.telefone IS NOT NULL
    ) as unverified_count
  FROM lideres l
  LEFT JOIN leader_tree lt ON lt.root_leader_id = l.id
  WHERE l.is_active = true
    AND (search_term = '' OR l.nome_completo ILIKE '%' || search_term || '%')
  GROUP BY l.id, l.nome_completo
  HAVING COUNT(*) FILTER (
    WHERE lt.level > 0 
    AND (lt.is_verified = false OR lt.is_verified IS NULL) 
    AND lt.telefone IS NOT NULL
  ) > 0
  ORDER BY l.nome_completo
  LIMIT 20;
$$;