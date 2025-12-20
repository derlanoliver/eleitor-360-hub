-- Função para buscar ranking do líder (corrigida)
CREATE OR REPLACE FUNCTION public.get_leader_ranking_position(_leader_id UUID)
RETURNS TABLE(
  ranking_position INTEGER,
  total_leaders INTEGER,
  pontuacao INTEGER,
  percentile NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pontuacao INTEGER;
  _position INTEGER;
  _total INTEGER;
BEGIN
  SELECT pontuacao_total INTO _pontuacao FROM lideres WHERE id = _leader_id;
  
  SELECT COUNT(*)::INTEGER INTO _position
  FROM lideres
  WHERE is_active = true AND pontuacao_total > _pontuacao;
  
  SELECT COUNT(*)::INTEGER INTO _total FROM lideres WHERE is_active = true;
  
  RETURN QUERY SELECT
    (_position + 1) as ranking_position,
    _total as total_leaders,
    _pontuacao as pontuacao,
    ROUND((1 - (_position::NUMERIC / NULLIF(_total, 0))) * 100, 1) as percentile;
END;
$$;

-- Função para buscar árvore do líder com estatísticas
CREATE OR REPLACE FUNCTION public.get_leader_tree_stats(_leader_id UUID)
RETURNS TABLE(
  total_leaders INTEGER,
  total_cadastros INTEGER,
  total_pontos INTEGER,
  direct_subordinates INTEGER,
  top_subordinate_name TEXT,
  top_subordinate_cadastros INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH tree AS (
    SELECT * FROM get_leader_tree(_leader_id)
  ),
  direct_subs AS (
    SELECT t.nome_completo, t.cadastros, t.parent_leader_id FROM tree t WHERE t.parent_leader_id = _leader_id
  ),
  top_sub AS (
    SELECT ds.nome_completo, ds.cadastros FROM direct_subs ds ORDER BY ds.cadastros DESC LIMIT 1
  )
  SELECT
    (SELECT COUNT(*)::INTEGER - 1 FROM tree) as total_leaders,
    (SELECT COALESCE(SUM(t.cadastros), 0)::INTEGER FROM tree t) as total_cadastros,
    (SELECT COALESCE(SUM(t.pontuacao_total), 0)::INTEGER FROM tree t) as total_pontos,
    (SELECT COUNT(*)::INTEGER FROM direct_subs) as direct_subordinates,
    (SELECT ts.nome_completo FROM top_sub ts) as top_subordinate_name,
    (SELECT ts.cadastros FROM top_sub ts) as top_subordinate_cadastros;
END;
$$;