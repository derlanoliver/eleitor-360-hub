-- Create function to get all coordinators with their network stats
CREATE OR REPLACE FUNCTION get_all_coordinators_with_stats()
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  email TEXT,
  telefone TEXT,
  cidade_id UUID,
  cidade_nome TEXT,
  cadastros INTEGER,
  pontuacao_total INTEGER,
  total_leaders INTEGER,
  total_cadastros INTEGER,
  total_pontos INTEGER
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.id,
    l.nome_completo,
    l.email,
    l.telefone,
    l.cidade_id,
    c.nome as cidade_nome,
    l.cadastros,
    l.pontuacao_total,
    COALESCE(stats.total_leaders, 0) as total_leaders,
    COALESCE(stats.total_cadastros, 0) as total_cadastros,
    COALESCE(stats.total_pontos, 0) as total_pontos
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  LEFT JOIN LATERAL get_coordinator_network_stats(l.id) stats ON true
  WHERE l.is_coordinator = true
  ORDER BY l.nome_completo;
$$;