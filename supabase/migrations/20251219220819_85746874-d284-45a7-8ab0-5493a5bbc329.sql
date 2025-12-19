-- Função para calcular total de indicações de um líder
CREATE OR REPLACE FUNCTION get_leader_total_indicacoes(_leader_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contatos INTEGER;
  _eventos INTEGER;
  _pesquisas INTEGER;
BEGIN
  -- Contatos indicados pelo líder
  SELECT COUNT(*) INTO _contatos 
  FROM office_contacts 
  WHERE source_id = _leader_id::text AND source_type = 'lider';
  
  -- Inscrições em eventos indicadas pelo líder
  SELECT COUNT(*) INTO _eventos 
  FROM event_registrations 
  WHERE leader_id = _leader_id;
  
  -- Respostas de pesquisas indicadas pelo líder (não-líderes)
  SELECT COUNT(*) INTO _pesquisas 
  FROM survey_responses 
  WHERE referred_by_leader_id = _leader_id AND is_leader = false;
  
  RETURN COALESCE(_contatos, 0) + COALESCE(_eventos, 0) + COALESCE(_pesquisas, 0);
END;
$$;

-- Função para buscar top líderes com indicações calculadas
CREATE OR REPLACE FUNCTION get_top_leaders_with_indicacoes(_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  nome_completo TEXT,
  telefone TEXT,
  pontuacao_total INTEGER,
  indicacoes INTEGER,
  cidade_nome TEXT,
  is_active BOOLEAN
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
    l.is_active
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  WHERE l.is_active = true
  ORDER BY l.pontuacao_total DESC
  LIMIT _limit;
END;
$$;