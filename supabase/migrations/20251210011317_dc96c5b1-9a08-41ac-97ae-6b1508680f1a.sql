-- Função para retornar a cidade com mais cadastros
CREATE OR REPLACE FUNCTION get_top_city()
RETURNS TABLE (city_name text, city_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.nome as city_name,
    COUNT(oc.id) as city_count
  FROM office_contacts oc
  JOIN office_cities c ON c.id = oc.cidade_id
  WHERE oc.cidade_id IS NOT NULL
  GROUP BY c.id, c.nome
  ORDER BY city_count DESC
  LIMIT 1;
$$;