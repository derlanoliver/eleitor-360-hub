-- Função para contar total de líderes no ranking (com filtros)
CREATE OR REPLACE FUNCTION get_leaders_ranking_count(
  p_region TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_region IS NOT NULL AND p_region != 'all' THEN
    RETURN (
      SELECT COUNT(*)::INTEGER
      FROM lideres l
      LEFT JOIN office_cities c ON c.id = l.cidade_id
      WHERE l.is_active = true
        AND c.nome = p_region
    );
  ELSE
    RETURN (SELECT COUNT(*)::INTEGER FROM lideres WHERE is_active = true);
  END IF;
END;
$$;

-- Função paginada para ranking de líderes
CREATE OR REPLACE FUNCTION get_leaders_ranking_paginated(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_region TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  nome_completo text,
  telefone text,
  pontuacao_total integer,
  indicacoes integer,
  cidade_nome text,
  last_activity timestamp with time zone,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.telefone,
    l.pontuacao_total,
    get_leader_total_indicacoes(l.id) as indicacoes,
    c.nome as cidade_nome,
    l.last_activity,
    l.is_active
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  WHERE l.is_active = true
    AND (p_region IS NULL OR p_region = 'all' OR c.nome = p_region)
  ORDER BY l.pontuacao_total DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;