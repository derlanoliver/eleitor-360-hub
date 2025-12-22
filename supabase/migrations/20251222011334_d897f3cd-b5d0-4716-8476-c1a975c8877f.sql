-- Fix legacy RPC signature used by the frontend ("_page/_page_size/_cidade_id/_search/_verification_filter")
-- by handling leaders born on 29/02 in non-leap years.

CREATE OR REPLACE FUNCTION public.get_leaders_by_birthday(
  _page integer DEFAULT 1,
  _page_size integer DEFAULT 10,
  _cidade_id uuid DEFAULT NULL::uuid,
  _search text DEFAULT NULL::text,
  _verification_filter text DEFAULT 'all'::text
)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  email text,
  telefone text,
  cidade_id uuid,
  is_active boolean,
  is_verified boolean,
  cadastros integer,
  pontuacao_total integer,
  data_nascimento date,
  is_coordinator boolean,
  hierarchy_level integer,
  affiliate_token text,
  verification_sent_at timestamptz,
  verified_at timestamptz,
  parent_leader_id uuid,
  observacao text,
  days_until_birthday integer,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_count bigint;
  current_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  next_year integer := (EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1);
  is_current_leap boolean := (current_year % 4 = 0 AND (current_year % 100 != 0 OR current_year % 400 = 0));
  is_next_leap boolean := (next_year % 4 = 0 AND (next_year % 100 != 0 OR next_year % 400 = 0));
BEGIN
  SELECT COUNT(*)
    INTO _total_count
  FROM public.lideres l
  WHERE l.is_active = TRUE
    AND l.data_nascimento IS NOT NULL
    AND (_cidade_id IS NULL OR l.cidade_id = _cidade_id)
    AND (
      _verification_filter = 'all'
      OR (_verification_filter = 'verified' AND l.is_verified = TRUE)
      OR (_verification_filter = 'not_verified' AND (l.is_verified = FALSE OR l.is_verified IS NULL))
    )
    AND (
      _search IS NULL OR _search = ''
      OR l.nome_completo ILIKE '%' || _search || '%'
      OR l.telefone ILIKE '%' || regexp_replace(_search, '\D', '', 'g') || '%'
      OR l.email ILIKE '%' || _search || '%'
    );

  RETURN QUERY
  WITH filtered AS (
    SELECT
      l.*,
      EXTRACT(MONTH FROM l.data_nascimento)::integer AS m,
      EXTRACT(DAY FROM l.data_nascimento)::integer AS d
    FROM public.lideres l
    WHERE l.is_active = TRUE
      AND l.data_nascimento IS NOT NULL
      AND (_cidade_id IS NULL OR l.cidade_id = _cidade_id)
      AND (
        _verification_filter = 'all'
        OR (_verification_filter = 'verified' AND l.is_verified = TRUE)
        OR (_verification_filter = 'not_verified' AND (l.is_verified = FALSE OR l.is_verified IS NULL))
      )
      AND (
        _search IS NULL OR _search = ''
        OR l.nome_completo ILIKE '%' || _search || '%'
        OR l.telefone ILIKE '%' || regexp_replace(_search, '\D', '', 'g') || '%'
        OR l.email ILIKE '%' || _search || '%'
      )
  ),
  birthdays AS (
    SELECT
      f.*,
      CASE
        WHEN f.m = 2 AND f.d = 29 AND NOT is_current_leap THEN MAKE_DATE(current_year, 2, 28)
        ELSE MAKE_DATE(current_year, f.m, f.d)
      END AS birthday_this_year,
      CASE
        WHEN f.m = 2 AND f.d = 29 AND NOT is_next_leap THEN MAKE_DATE(next_year, 2, 28)
        ELSE MAKE_DATE(next_year, f.m, f.d)
      END AS birthday_next_year
    FROM filtered f
  ),
  ranked AS (
    SELECT
      b.*,
      CASE
        WHEN b.birthday_this_year >= CURRENT_DATE THEN (b.birthday_this_year - CURRENT_DATE)::integer
        ELSE (b.birthday_next_year - CURRENT_DATE)::integer
      END AS calculated_days
    FROM birthdays b
  )
  SELECT
    r.id,
    r.nome_completo,
    r.email,
    r.telefone,
    r.cidade_id,
    r.is_active,
    r.is_verified,
    r.cadastros,
    r.pontuacao_total,
    r.data_nascimento,
    r.is_coordinator,
    r.hierarchy_level,
    r.affiliate_token,
    r.verification_sent_at,
    r.verified_at,
    r.parent_leader_id,
    r.observacao,
    r.calculated_days AS days_until_birthday,
    _total_count AS total_count
  FROM ranked r
  ORDER BY r.calculated_days ASC, r.nome_completo ASC
  LIMIT _page_size
  OFFSET (_page - 1) * _page_size;
END;
$$;