-- Função para buscar coordenadores com contagem de não verificados (por telefone)
CREATE OR REPLACE FUNCTION public.get_coordinators_with_unverified_count_sms(search_term text DEFAULT '')
RETURNS TABLE(id uuid, nome_completo text, total_in_tree bigint, unverified_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE leader_tree AS (
    SELECT l.id, l.nome_completo, l.telefone, l.is_verified, l.id as coordinator_id, 0 as level
    FROM lideres l
    WHERE l.is_coordinator = true AND l.is_active = true
    
    UNION ALL
    
    SELECT sub.id, sub.nome_completo, sub.telefone, sub.is_verified, lt.coordinator_id, lt.level + 1
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT 
    c.id,
    c.nome_completo,
    COUNT(*) FILTER (WHERE lt.level > 0) as total_in_tree,
    COUNT(*) FILTER (WHERE lt.level > 0 AND (lt.is_verified = false OR lt.is_verified IS NULL) AND lt.telefone IS NOT NULL) as unverified_count
  FROM lideres c
  LEFT JOIN leader_tree lt ON lt.coordinator_id = c.id
  WHERE c.is_coordinator = true 
    AND c.is_active = true
    AND (search_term = '' OR c.nome_completo ILIKE '%' || search_term || '%')
  GROUP BY c.id, c.nome_completo
  HAVING COUNT(*) FILTER (WHERE lt.level > 0 AND (lt.is_verified = false OR lt.is_verified IS NULL) AND lt.telefone IS NOT NULL) > 0
  ORDER BY c.nome_completo
  LIMIT 20;
$$;

-- Função para buscar líderes não verificados na árvore (por telefone)
CREATE OR REPLACE FUNCTION public.get_unverified_leaders_in_tree_sms(coordinator_id uuid)
RETURNS TABLE(id uuid, nome_completo text, telefone text, verification_code text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE leader_tree AS (
    SELECT l.id, l.nome_completo, l.telefone, l.verification_code, l.is_verified
    FROM lideres l
    WHERE l.id = coordinator_id AND l.is_active = true
    
    UNION ALL
    
    SELECT sub.id, sub.nome_completo, sub.telefone, sub.verification_code, sub.is_verified
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT lt.id, lt.nome_completo, lt.telefone, lt.verification_code
  FROM leader_tree lt
  WHERE (lt.is_verified = false OR lt.is_verified IS NULL)
    AND lt.telefone IS NOT NULL 
    AND lt.id != coordinator_id
  ORDER BY lt.nome_completo;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_coordinators_with_unverified_count_sms(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unverified_leaders_in_tree_sms(uuid) TO authenticated;