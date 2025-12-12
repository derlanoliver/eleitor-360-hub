-- Função para buscar o caminho hierárquico de um líder até o coordenador
CREATE OR REPLACE FUNCTION get_leader_hierarchy_path(_leader_id uuid)
RETURNS TABLE (
  id uuid,
  nome_completo text,
  hierarchy_level integer,
  is_coordinator boolean,
  parent_leader_id uuid,
  cidade_nome text,
  telefone text,
  email text,
  depth integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH RECURSIVE hierarchy AS (
  SELECT 
    l.id, 
    l.nome_completo, 
    l.hierarchy_level, 
    l.is_coordinator, 
    l.parent_leader_id, 
    c.nome as cidade_nome,
    l.telefone,
    l.email,
    1 as depth
  FROM lideres l
  LEFT JOIN office_cities c ON l.cidade_id = c.id
  WHERE l.id = _leader_id
  
  UNION ALL
  
  SELECT 
    l.id, 
    l.nome_completo, 
    l.hierarchy_level, 
    l.is_coordinator, 
    l.parent_leader_id, 
    c.nome,
    l.telefone,
    l.email,
    h.depth + 1
  FROM lideres l
  LEFT JOIN office_cities c ON l.cidade_id = c.id
  INNER JOIN hierarchy h ON l.id = h.parent_leader_id
)
SELECT * FROM hierarchy ORDER BY depth ASC;
$$;