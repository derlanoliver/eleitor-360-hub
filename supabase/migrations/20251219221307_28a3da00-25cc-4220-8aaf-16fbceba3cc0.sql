-- Corrigir função get_leader_total_indicacoes removendo conversão incorreta de tipos
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
  -- Contatos indicados (source_id é TEXT, então converter UUID para TEXT)
  SELECT COUNT(*) INTO _contatos 
  FROM office_contacts 
  WHERE source_id::uuid = _leader_id AND source_type = 'lider';
  
  -- Inscrições em eventos
  SELECT COUNT(*) INTO _eventos 
  FROM event_registrations 
  WHERE leader_id = _leader_id;
  
  -- Respostas de pesquisas indicadas
  SELECT COUNT(*) INTO _pesquisas 
  FROM survey_responses 
  WHERE referred_by_leader_id = _leader_id AND is_leader = false;
  
  RETURN COALESCE(_contatos, 0) + COALESCE(_eventos, 0) + COALESCE(_pesquisas, 0);
END;
$$;