-- Aumentar limite de coordenadores retornados de 20 para 100
CREATE OR REPLACE FUNCTION public.get_coordinators_with_unverified_count_sms(search_term text DEFAULT '')
RETURNS TABLE(id uuid, nome_completo text, total_in_tree bigint, unverified_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE tree AS (
    -- Base: coordenadores ativos com telefone
    SELECT l.id, l.nome_completo, l.parent_leader_id, l.is_verified
    FROM lideres l
    WHERE l.is_active = true
      AND l.is_coordinator = true
      AND l.telefone IS NOT NULL
      AND (search_term = '' OR l.nome_completo ILIKE '%' || search_term || '%')
    
    UNION ALL
    
    -- Recursão: subordinados ativos com telefone
    SELECT l.id, l.nome_completo, l.parent_leader_id, l.is_verified
    FROM lideres l
    INNER JOIN tree t ON l.parent_leader_id = t.id
    WHERE l.is_active = true
      AND l.telefone IS NOT NULL
  ),
  coordinator_stats AS (
    SELECT 
      c.id,
      c.nome_completo,
      COUNT(DISTINCT t.id) as total_in_tree,
      COUNT(DISTINCT CASE WHEN t.is_verified = false THEN t.id END) as unverified_count
    FROM lideres c
    LEFT JOIN tree t ON (
      t.id = c.id OR 
      EXISTS (
        WITH RECURSIVE subtree AS (
          SELECT l.id, l.parent_leader_id
          FROM lideres l WHERE l.id = c.id
          UNION ALL
          SELECT l.id, l.parent_leader_id
          FROM lideres l
          INNER JOIN subtree s ON l.parent_leader_id = s.id
          WHERE l.is_active = true AND l.telefone IS NOT NULL
        )
        SELECT 1 FROM subtree WHERE subtree.id = t.id
      )
    )
    WHERE c.is_active = true
      AND c.is_coordinator = true
      AND c.telefone IS NOT NULL
      AND (search_term = '' OR c.nome_completo ILIKE '%' || search_term || '%')
    GROUP BY c.id, c.nome_completo
  )
  SELECT id, nome_completo, total_in_tree, unverified_count
  FROM coordinator_stats
  WHERE unverified_count > 0
  ORDER BY unverified_count DESC, nome_completo
  LIMIT 100;
$$;