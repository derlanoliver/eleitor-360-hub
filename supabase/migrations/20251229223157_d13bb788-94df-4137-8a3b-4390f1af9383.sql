-- Atualizar função para calcular total de indicações de um líder
CREATE OR REPLACE FUNCTION public.get_leader_total_indicacoes(_leader_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _contatos INTEGER;
  _eventos INTEGER;
  _pesquisas INTEGER;
  _lideres_subordinados INTEGER;
BEGIN
  -- Contatos indicados (source_type = 'lider')
  SELECT COUNT(*) INTO _contatos 
  FROM office_contacts 
  WHERE source_id::uuid = _leader_id AND source_type = 'lider';
  
  -- Inscrições em eventos indicadas por este líder
  SELECT COUNT(*) INTO _eventos 
  FROM event_registrations 
  WHERE leader_id = _leader_id;
  
  -- Respostas de pesquisas indicadas por este líder (não-líderes)
  SELECT COUNT(*) INTO _pesquisas 
  FROM survey_responses 
  WHERE referred_by_leader_id = _leader_id AND is_leader = false;
  
  -- Líderes subordinados diretos (indicados por este líder)
  SELECT COUNT(*) INTO _lideres_subordinados
  FROM lideres
  WHERE parent_leader_id = _leader_id AND is_active = true;
  
  RETURN COALESCE(_contatos, 0) + COALESCE(_eventos, 0) + COALESCE(_pesquisas, 0) + COALESCE(_lideres_subordinados, 0);
END;
$$;

-- Criar função para retornar ranking com indicações calculadas
CREATE OR REPLACE FUNCTION public.get_leaders_ranking_with_indicacoes()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  telefone text,
  pontuacao_total integer,
  indicacoes integer,
  cidade_nome text,
  last_activity timestamptz,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  ORDER BY l.pontuacao_total DESC;
END;
$$;