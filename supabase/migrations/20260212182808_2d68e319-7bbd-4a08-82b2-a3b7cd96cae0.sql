
CREATE OR REPLACE FUNCTION public.search_leaders_by_term(_term text, _limit int DEFAULT 30)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  email text,
  telefone text,
  is_coordinator boolean,
  hierarchy_level int,
  parent_leader_id uuid,
  cidade_nome text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _normalized text;
  _digits text;
BEGIN
  _normalized := lower(unaccent(_term));
  _digits := regexp_replace(_term, '\D', '', 'g');

  RETURN QUERY
  SELECT
    l.id,
    l.nome_completo,
    l.email,
    l.telefone,
    l.is_coordinator,
    l.hierarchy_level,
    l.parent_leader_id,
    c.nome AS cidade_nome
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  WHERE l.is_active = true
    AND (
      lower(unaccent(l.nome_completo)) ILIKE '%' || _normalized || '%'
      OR lower(l.email) ILIKE '%' || _normalized || '%'
      OR (length(_digits) >= 4 AND l.telefone IS NOT NULL AND regexp_replace(l.telefone, '\D', '', 'g') LIKE '%' || _digits || '%')
    )
  ORDER BY l.nome_completo
  LIMIT _limit;
END;
$$;
