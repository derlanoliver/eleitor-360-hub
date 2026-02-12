
-- RPC for profile stats (gender distribution, avg age, event participation)
CREATE OR REPLACE FUNCTION public.get_profile_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'genero', (
      SELECT json_agg(json_build_object('label', g.genero_label, 'count', g.cnt))
      FROM (
        SELECT COALESCE(genero, 'Não identificado') as genero_label, count(*) as cnt
        FROM office_contacts
        GROUP BY COALESCE(genero, 'Não identificado')
      ) g
    ),
    'total_contacts', (SELECT count(*) FROM office_contacts),
    'idade_media', (
      SELECT COALESCE(round(avg(
        EXTRACT(YEAR FROM age(now(), data_nascimento::date))
      ))::int, 0)
      FROM office_contacts
      WHERE data_nascimento IS NOT NULL
        AND data_nascimento::date < now()
        AND EXTRACT(YEAR FROM age(now(), data_nascimento::date)) BETWEEN 18 AND 100
    ),
    'contacts_with_checkin', (
      SELECT count(DISTINCT contact_id)
      FROM event_registrations
      WHERE checked_in = true AND contact_id IS NOT NULL
    )
  );
$$;

-- RPC for cities ranking
CREATE OR REPLACE FUNCTION public.get_cities_ranking()
RETURNS TABLE(city_name TEXT, city_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oc2.nome, count(*) as city_count
  FROM office_contacts c
  JOIN office_cities oc2 ON c.cidade_id = oc2.id
  WHERE c.cidade_id IS NOT NULL
  GROUP BY oc2.nome
  ORDER BY city_count DESC
  LIMIT 10;
$$;

-- RPC for distinct cities count (for dashboard stats)
CREATE OR REPLACE FUNCTION public.get_distinct_cities_count()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(DISTINCT cidade_id)
  FROM office_contacts
  WHERE cidade_id IS NOT NULL;
$$;
