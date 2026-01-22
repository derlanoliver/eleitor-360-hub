-- RPC para buscar todos os líderes na árvore de um líder específico (para template bemvindo1)
CREATE OR REPLACE FUNCTION get_leaders_in_tree_whatsapp(leader_id uuid)
RETURNS TABLE(id uuid, nome_completo text, telefone text, affiliate_token text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE leader_tree AS (
    SELECT l.id, l.nome_completo, l.telefone, l.affiliate_token
    FROM lideres l
    WHERE l.id = leader_id AND l.is_active = true
    
    UNION ALL
    
    SELECT sub.id, sub.nome_completo, sub.telefone, sub.affiliate_token
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT lt.id, lt.nome_completo, lt.telefone, lt.affiliate_token
  FROM leader_tree lt
  WHERE lt.telefone IS NOT NULL 
    AND lt.affiliate_token IS NOT NULL
    AND lt.id != leader_id
  ORDER BY lt.nome_completo;
$$;

-- RPC para buscar líderes não verificados na árvore (para template confirmar1)
CREATE OR REPLACE FUNCTION get_unverified_leaders_in_tree_whatsapp(leader_id uuid)
RETURNS TABLE(id uuid, nome_completo text, telefone text, verification_code text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE leader_tree AS (
    SELECT l.id, l.nome_completo, l.telefone, l.verification_code, l.is_verified
    FROM lideres l
    WHERE l.id = leader_id AND l.is_active = true
    
    UNION ALL
    
    SELECT sub.id, sub.nome_completo, sub.telefone, sub.verification_code, sub.is_verified
    FROM lideres sub
    INNER JOIN leader_tree lt ON sub.parent_leader_id = lt.id
    WHERE sub.is_active = true
  )
  SELECT lt.id, lt.nome_completo, lt.telefone, lt.verification_code
  FROM leader_tree lt
  WHERE lt.telefone IS NOT NULL 
    AND lt.verification_code IS NOT NULL
    AND (lt.is_verified = false OR lt.is_verified IS NULL)
    AND lt.id != leader_id
  ORDER BY lt.nome_completo;
$$;

-- RPC para contar líderes na árvore (todos) para exibição no select
CREATE OR REPLACE FUNCTION get_leaders_with_tree_count_whatsapp()
RETURNS TABLE(id uuid, nome_completo text, telefone text, total_in_tree bigint, unverified_in_tree bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE all_leaders AS (
    SELECT l.id, l.nome_completo, l.telefone
    FROM lideres l
    WHERE l.is_active = true
      AND l.telefone IS NOT NULL
  ),
  tree_counts AS (
    SELECT 
      parent.id as leader_id,
      COUNT(DISTINCT child.id) FILTER (WHERE child.affiliate_token IS NOT NULL) as total_count,
      COUNT(DISTINCT child.id) FILTER (WHERE (child.is_verified = false OR child.is_verified IS NULL) AND child.verification_code IS NOT NULL) as unverified_count
    FROM all_leaders parent
    LEFT JOIN LATERAL (
      WITH RECURSIVE subtree AS (
        SELECT l.id, l.affiliate_token, l.is_verified, l.verification_code
        FROM lideres l
        WHERE l.parent_leader_id = parent.id AND l.is_active = true
        
        UNION ALL
        
        SELECT sub.id, sub.affiliate_token, sub.is_verified, sub.verification_code
        FROM lideres sub
        INNER JOIN subtree st ON sub.parent_leader_id = st.id
        WHERE sub.is_active = true
      )
      SELECT * FROM subtree
    ) child ON true
    GROUP BY parent.id
  )
  SELECT 
    al.id,
    al.nome_completo,
    al.telefone,
    COALESCE(tc.total_count, 0) as total_in_tree,
    COALESCE(tc.unverified_count, 0) as unverified_in_tree
  FROM all_leaders al
  LEFT JOIN tree_counts tc ON tc.leader_id = al.id
  WHERE COALESCE(tc.total_count, 0) > 0 OR COALESCE(tc.unverified_count, 0) > 0
  ORDER BY al.nome_completo;
$$;