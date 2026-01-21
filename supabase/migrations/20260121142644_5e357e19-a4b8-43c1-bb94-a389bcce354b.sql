-- Criar função de validação para parent_leader_id
CREATE OR REPLACE FUNCTION validate_leader_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- Se parent_leader_id está sendo definido, validar que o pai está na hierarquia
  IF NEW.parent_leader_id IS NOT NULL THEN
    -- Verificar se o pai existe e está na hierarquia (é coordenador OU tem hierarchy_level)
    IF NOT EXISTS (
      SELECT 1 FROM lideres 
      WHERE id = NEW.parent_leader_id 
      AND is_active = true
      AND (is_coordinator = true OR hierarchy_level IS NOT NULL)
    ) THEN
      RAISE EXCEPTION 'O líder pai selecionado não está em uma hierarquia válida. O pai deve ser um coordenador ou estar vinculado a uma árvore.';
    END IF;
    
    -- Se o pai está na hierarquia, calcular o nível do filho
    -- Coordenador = nível 1, então filho de coordenador = nível 2, etc.
    SELECT 
      CASE 
        WHEN is_coordinator = true THEN 2
        ELSE COALESCE(hierarchy_level, 1) + 1
      END INTO NEW.hierarchy_level
    FROM lideres 
    WHERE id = NEW.parent_leader_id;
    
    -- Validar que não excede o nível máximo (6)
    IF NEW.hierarchy_level > 6 THEN
      RAISE EXCEPTION 'Não é possível adicionar subordinados além do nível 6 da hierarquia.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger que executa antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS trigger_validate_leader_parent ON lideres;

CREATE TRIGGER trigger_validate_leader_parent
BEFORE INSERT OR UPDATE OF parent_leader_id ON lideres
FOR EACH ROW
EXECUTE FUNCTION validate_leader_parent();

-- Adicionar comentário explicativo
COMMENT ON FUNCTION validate_leader_parent() IS 
'Valida que parent_leader_id sempre aponta para um líder na hierarquia (coordenador ou com hierarchy_level definido) e calcula automaticamente o hierarchy_level do filho.';