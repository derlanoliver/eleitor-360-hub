-- Corrigir líderes cujo parent_leader_id aponta para líderes fora da hierarquia
-- Isso os tornará "disponíveis" para serem adicionados a uma árvore válida

-- Primeiro, identificar e corrigir líderes cujo pai está "avulso" (sem hierarquia)
UPDATE lideres l
SET 
  parent_leader_id = NULL, 
  hierarchy_level = NULL,
  updated_at = now()
WHERE l.is_active = true
  AND l.parent_leader_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM lideres p
    WHERE p.id = l.parent_leader_id
    AND p.is_coordinator = false
    AND p.parent_leader_id IS NULL
    AND p.hierarchy_level IS NULL
  );

-- Também corrigir líderes com hierarchy_level definido mas sem parent e não sendo coordenador
UPDATE lideres
SET 
  hierarchy_level = NULL,
  updated_at = now()
WHERE is_active = true
  AND is_coordinator = false
  AND parent_leader_id IS NULL
  AND hierarchy_level IS NOT NULL;