-- Recriar função get_leaders_by_birthday com tratamento para 29 de fevereiro
CREATE OR REPLACE FUNCTION public.get_leaders_by_birthday(
  p_cidade_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_verification_filter text DEFAULT 'all',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  nome_completo text,
  email text,
  telefone text,
  cidade_id uuid,
  status public.office_leader_status,
  is_active boolean,
  cadastros integer,
  pontuacao_total integer,
  data_nascimento date,
  affiliate_token text,
  is_verified boolean,
  verified_at timestamptz,
  is_coordinator boolean,
  hierarchy_level integer,
  parent_leader_id uuid,
  observacao text,
  created_at timestamptz,
  updated_at timestamptz,
  days_until_birthday integer,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  next_year integer := current_year + 1;
  -- Verificar se o ano atual é bissexto
  is_current_leap boolean := (current_year % 4 = 0 AND (current_year % 100 != 0 OR current_year % 400 = 0));
  is_next_leap boolean := (next_year % 4 = 0 AND (next_year % 100 != 0 OR next_year % 400 = 0));
BEGIN
  RETURN QUERY
  WITH filtered_leaders AS (
    SELECT l.*
    FROM public.lideres l
    WHERE l.data_nascimento IS NOT NULL
      AND l.is_active = true
      AND (p_cidade_id IS NULL OR l.cidade_id = p_cidade_id)
      AND (p_search IS NULL OR p_search = '' OR 
           l.nome_completo ILIKE '%' || p_search || '%' OR
           l.telefone ILIKE '%' || p_search || '%' OR
           l.email ILIKE '%' || p_search || '%')
      AND (p_verification_filter = 'all' OR
           (p_verification_filter = 'verified' AND l.is_verified = true) OR
           (p_verification_filter = 'not_verified' AND (l.is_verified = false OR l.is_verified IS NULL)))
  ),
  leaders_with_birthday AS (
    SELECT 
      fl.*,
      -- Calcular a data do aniversário este ano, tratando 29/02
      CASE 
        WHEN EXTRACT(MONTH FROM fl.data_nascimento) = 2 
             AND EXTRACT(DAY FROM fl.data_nascimento) = 29
             AND NOT is_current_leap
        THEN MAKE_DATE(current_year, 2, 28)
        ELSE MAKE_DATE(
          current_year, 
          EXTRACT(MONTH FROM fl.data_nascimento)::integer, 
          EXTRACT(DAY FROM fl.data_nascimento)::integer
        )
      END AS birthday_this_year,
      -- Calcular a data do aniversário no próximo ano, tratando 29/02
      CASE 
        WHEN EXTRACT(MONTH FROM fl.data_nascimento) = 2 
             AND EXTRACT(DAY FROM fl.data_nascimento) = 29
             AND NOT is_next_leap
        THEN MAKE_DATE(next_year, 2, 28)
        ELSE MAKE_DATE(
          next_year, 
          EXTRACT(MONTH FROM fl.data_nascimento)::integer, 
          EXTRACT(DAY FROM fl.data_nascimento)::integer
        )
      END AS birthday_next_year
    FROM filtered_leaders fl
  ),
  leaders_with_days AS (
    SELECT 
      lwb.*,
      CASE 
        WHEN lwb.birthday_this_year >= CURRENT_DATE 
        THEN (lwb.birthday_this_year - CURRENT_DATE)::integer
        ELSE (lwb.birthday_next_year - CURRENT_DATE)::integer
      END AS calculated_days
    FROM leaders_with_birthday lwb
  ),
  total AS (
    SELECT COUNT(*) AS cnt FROM leaders_with_days
  )
  SELECT 
    lwd.id,
    lwd.nome_completo,
    lwd.email,
    lwd.telefone,
    lwd.cidade_id,
    lwd.status,
    lwd.is_active,
    lwd.cadastros,
    lwd.pontuacao_total,
    lwd.data_nascimento,
    lwd.affiliate_token,
    lwd.is_verified,
    lwd.verified_at,
    lwd.is_coordinator,
    lwd.hierarchy_level,
    lwd.parent_leader_id,
    lwd.observacao,
    lwd.created_at,
    lwd.updated_at,
    lwd.calculated_days AS days_until_birthday,
    t.cnt AS total_count
  FROM leaders_with_days lwd
  CROSS JOIN total t
  ORDER BY lwd.calculated_days ASC, lwd.nome_completo ASC
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
END;
$$;