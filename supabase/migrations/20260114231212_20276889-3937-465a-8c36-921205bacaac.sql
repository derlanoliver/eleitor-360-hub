-- Update the get_coordinators_with_unverified_count function to include all leaders with unverified subordinates
-- Not just coordinators (matching the SMS version behavior)

CREATE OR REPLACE FUNCTION public.get_coordinators_with_unverified_count(search_term text DEFAULT ''::text)
RETURNS TABLE(id uuid, nome_completo text, total_in_tree bigint, unverified_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE leader_tree AS (
    -- Start with ALL active leaders (not just coordinators)
    SELECT l.id, l.nome_completo, l.email, l.is_verified, l.id as root_leader_id, 0 as level
    FROM lideres l
    WHERE l.is_active = true
    
    UNION ALL
    
    SELECT sub.id, sub.nome_completo, sub.email, sub.is_verified, lt.root_leader_id, lt.level + 1
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT 
    l.id,
    l.nome_completo,
    COUNT(*) FILTER (WHERE lt.level > 0) as total_in_tree,
    COUNT(*) FILTER (WHERE lt.level > 0 AND (lt.is_verified = false OR lt.is_verified IS NULL) AND lt.email IS NOT NULL AND lt.email != '') as unverified_count
  FROM lideres l
  LEFT JOIN leader_tree lt ON lt.root_leader_id = l.id
  WHERE l.is_active = true
    AND (search_term = '' OR l.nome_completo ILIKE '%' || search_term || '%')
  GROUP BY l.id, l.nome_completo
  HAVING COUNT(*) FILTER (WHERE lt.level > 0 AND (lt.is_verified = false OR lt.is_verified IS NULL) AND lt.email IS NOT NULL AND lt.email != '') > 0
  ORDER BY l.nome_completo
  LIMIT 20;
$$;