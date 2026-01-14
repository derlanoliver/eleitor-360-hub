-- Create function to get coordinators cadastros report with recursive counting
CREATE OR REPLACE FUNCTION get_coordinators_cadastros_report()
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  cidade_nome TEXT,
  total_cadastros BIGINT,
  verificados BIGINT,
  pendentes BIGINT
) AS $$
WITH RECURSIVE subordinates AS (
  -- Base: subordinados diretos de cada coordenador
  SELECT 
    coord.id as coordinator_id,
    sub.id as subordinate_id,
    sub.is_verified
  FROM lideres coord
  INNER JOIN lideres sub ON sub.parent_leader_id = coord.id
  WHERE coord.is_coordinator = true 
    AND coord.is_active = true
    AND sub.is_active = true
  
  UNION ALL
  
  -- Recursão: subordinados de subordinados
  SELECT 
    s.coordinator_id,
    sub.id,
    sub.is_verified
  FROM subordinates s
  INNER JOIN lideres sub ON sub.parent_leader_id = s.subordinate_id
  WHERE sub.is_active = true
)
SELECT 
  coord.id,
  coord.nome_completo,
  c.nome as cidade_nome,
  COALESCE(stats.total, 0)::BIGINT as total_cadastros,
  COALESCE(stats.verified, 0)::BIGINT as verificados,
  (COALESCE(stats.total, 0) - COALESCE(stats.verified, 0))::BIGINT as pendentes
FROM lideres coord
LEFT JOIN office_cities c ON c.id = coord.cidade_id
LEFT JOIN (
  SELECT 
    coordinator_id,
    COUNT(*)::BIGINT as total,
    SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END)::BIGINT as verified
  FROM subordinates
  GROUP BY coordinator_id
) stats ON stats.coordinator_id = coord.id
WHERE coord.is_coordinator = true 
  AND coord.is_active = true
ORDER BY COALESCE(stats.total, 0) DESC;
$$ LANGUAGE SQL STABLE;