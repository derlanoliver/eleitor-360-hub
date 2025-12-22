-- Função para calcular dias até o próximo aniversário e retornar líderes ordenados
CREATE OR REPLACE FUNCTION get_leaders_by_birthday(
  _page INT DEFAULT 1,
  _page_size INT DEFAULT 10,
  _cidade_id UUID DEFAULT NULL,
  _search TEXT DEFAULT NULL,
  _verification_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  email TEXT,
  telefone TEXT,
  cidade_id UUID,
  is_active BOOLEAN,
  is_verified BOOLEAN,
  cadastros INT,
  pontuacao_total INT,
  data_nascimento DATE,
  is_coordinator BOOLEAN,
  hierarchy_level INT,
  affiliate_token TEXT,
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  parent_leader_id UUID,
  observacao TEXT,
  days_until_birthday INT,
  total_count BIGINT
) AS $$
DECLARE
  _total_count BIGINT;
BEGIN
  -- Primeiro, contar o total de registros que atendem aos filtros
  SELECT COUNT(*)
  INTO _total_count
  FROM lideres l
  WHERE l.is_active = TRUE
    AND l.data_nascimento IS NOT NULL
    AND (_cidade_id IS NULL OR l.cidade_id = _cidade_id)
    AND (_verification_filter = 'all' 
      OR (_verification_filter = 'verified' AND l.is_verified = TRUE)
      OR (_verification_filter = 'not_verified' AND (l.is_verified = FALSE OR l.is_verified IS NULL)))
    AND (_search IS NULL OR _search = '' OR l.nome_completo ILIKE '%' || _search || '%' 
      OR l.telefone ILIKE '%' || regexp_replace(_search, '\D', '', 'g') || '%');

  -- Retornar os resultados paginados
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.email,
    l.telefone,
    l.cidade_id,
    l.is_active,
    l.is_verified,
    l.cadastros,
    l.pontuacao_total,
    l.data_nascimento,
    l.is_coordinator,
    l.hierarchy_level,
    l.affiliate_token,
    l.verification_sent_at,
    l.verified_at,
    l.parent_leader_id,
    l.observacao,
    CASE 
      WHEN l.data_nascimento IS NULL THEN 366
      WHEN (MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM l.data_nascimento)::INT, EXTRACT(DAY FROM l.data_nascimento)::INT)) >= CURRENT_DATE 
        THEN (MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM l.data_nascimento)::INT, EXTRACT(DAY FROM l.data_nascimento)::INT) - CURRENT_DATE)
      ELSE (MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT + 1, EXTRACT(MONTH FROM l.data_nascimento)::INT, EXTRACT(DAY FROM l.data_nascimento)::INT) - CURRENT_DATE)
    END::INT AS days_until_birthday,
    _total_count AS total_count
  FROM lideres l
  WHERE l.is_active = TRUE
    AND l.data_nascimento IS NOT NULL
    AND (_cidade_id IS NULL OR l.cidade_id = _cidade_id)
    AND (_verification_filter = 'all' 
      OR (_verification_filter = 'verified' AND l.is_verified = TRUE)
      OR (_verification_filter = 'not_verified' AND (l.is_verified = FALSE OR l.is_verified IS NULL)))
    AND (_search IS NULL OR _search = '' OR l.nome_completo ILIKE '%' || _search || '%' 
      OR l.telefone ILIKE '%' || regexp_replace(_search, '\D', '', 'g') || '%')
  ORDER BY 
    CASE 
      WHEN l.data_nascimento IS NULL THEN 366
      WHEN (MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM l.data_nascimento)::INT, EXTRACT(DAY FROM l.data_nascimento)::INT)) >= CURRENT_DATE 
        THEN (MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM l.data_nascimento)::INT, EXTRACT(DAY FROM l.data_nascimento)::INT) - CURRENT_DATE)
      ELSE (MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT + 1, EXTRACT(MONTH FROM l.data_nascimento)::INT, EXTRACT(DAY FROM l.data_nascimento)::INT) - CURRENT_DATE)
    END ASC,
    l.nome_completo ASC
  LIMIT _page_size
  OFFSET (_page - 1) * _page_size;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;