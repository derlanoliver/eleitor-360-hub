-- Criar função para sincronizar cadastros de líderes
CREATE OR REPLACE FUNCTION sync_leader_registrations()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o contador do líder antigo (se houver mudança de líder)
  IF TG_OP = 'UPDATE' AND OLD.source_id IS DISTINCT FROM NEW.source_id THEN
    IF OLD.source_id IS NOT NULL AND OLD.source_type = 'lider' THEN
      UPDATE lideres 
      SET cadastros = (
        SELECT COUNT(*) 
        FROM office_contacts 
        WHERE source_id = OLD.source_id 
          AND source_type = 'lider'
      ),
      last_activity = now()
      WHERE id = OLD.source_id;
    END IF;
  END IF;

  -- Atualizar o contador do líder novo
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.source_id IS NOT NULL AND NEW.source_type = 'lider' THEN
    UPDATE lideres 
    SET cadastros = (
      SELECT COUNT(*) 
      FROM office_contacts 
      WHERE source_id = NEW.source_id 
        AND source_type = 'lider'
    ),
    last_activity = now()
    WHERE id = NEW.source_id;
  END IF;

  -- Em caso de DELETE, atualizar o líder que perdeu o contato
  IF TG_OP = 'DELETE' AND OLD.source_id IS NOT NULL AND OLD.source_type = 'lider' THEN
    UPDATE lideres 
    SET cadastros = (
      SELECT COUNT(*) 
      FROM office_contacts 
      WHERE source_id = OLD.source_id 
        AND source_type = 'lider'
    ),
    last_activity = now()
    WHERE id = OLD.source_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_sync_leader_registrations_after_insert_update ON office_contacts;
CREATE TRIGGER trigger_sync_leader_registrations_after_insert_update
AFTER INSERT OR UPDATE OF source_id, source_type ON office_contacts
FOR EACH ROW
EXECUTE FUNCTION sync_leader_registrations();

-- Criar trigger para DELETE
DROP TRIGGER IF EXISTS trigger_sync_leader_registrations_after_delete ON office_contacts;
CREATE TRIGGER trigger_sync_leader_registrations_after_delete
AFTER DELETE ON office_contacts
FOR EACH ROW
EXECUTE FUNCTION sync_leader_registrations();

-- Sincronizar dados existentes (correção inicial)
UPDATE lideres l
SET cadastros = (
  SELECT COUNT(*) 
  FROM office_contacts oc 
  WHERE oc.source_id = l.id 
    AND oc.source_type = 'lider'
),
last_activity = CASE 
  WHEN (SELECT COUNT(*) FROM office_contacts WHERE source_id = l.id AND source_type = 'lider') > 0 
  THEN now() 
  ELSE l.last_activity 
END;