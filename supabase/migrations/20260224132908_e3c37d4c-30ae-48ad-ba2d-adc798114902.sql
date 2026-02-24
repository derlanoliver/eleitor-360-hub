
-- Fix: count only active contacts AND trigger on is_active changes
CREATE OR REPLACE FUNCTION sync_leader_registrations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old leader count (on source change)
  IF TG_OP = 'UPDATE' AND OLD.source_id IS DISTINCT FROM NEW.source_id THEN
    IF OLD.source_id IS NOT NULL AND OLD.source_type = 'lider' THEN
      UPDATE lideres 
      SET cadastros = (
        SELECT COUNT(*) 
        FROM office_contacts 
        WHERE source_id = OLD.source_id 
          AND source_type = 'lider'
          AND is_active = true
      ),
      last_activity = now()
      WHERE id = OLD.source_id;
    END IF;
  END IF;

  -- Update new/current leader count
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.source_id IS NOT NULL AND NEW.source_type = 'lider' THEN
    UPDATE lideres 
    SET cadastros = (
      SELECT COUNT(*) 
      FROM office_contacts 
      WHERE source_id = NEW.source_id 
        AND source_type = 'lider'
        AND is_active = true
    ),
    last_activity = now()
    WHERE id = NEW.source_id;
  END IF;

  -- On DELETE, update the leader that lost the contact
  IF TG_OP = 'DELETE' AND OLD.source_id IS NOT NULL AND OLD.source_type = 'lider' THEN
    UPDATE lideres 
    SET cadastros = (
      SELECT COUNT(*) 
      FROM office_contacts 
      WHERE source_id = OLD.source_id 
        AND source_type = 'lider'
        AND is_active = true
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

-- Recreate triggers to also fire on is_active changes
DROP TRIGGER IF EXISTS trigger_sync_leader_registrations_after_insert_update ON office_contacts;
CREATE TRIGGER trigger_sync_leader_registrations_after_insert_update
AFTER INSERT OR UPDATE OF source_id, source_type, is_active ON office_contacts
FOR EACH ROW
EXECUTE FUNCTION sync_leader_registrations();

DROP TRIGGER IF EXISTS trigger_sync_leader_registrations_after_delete ON office_contacts;
CREATE TRIGGER trigger_sync_leader_registrations_after_delete
AFTER DELETE ON office_contacts
FOR EACH ROW
EXECUTE FUNCTION sync_leader_registrations();

-- Resync all existing data to count only active contacts
UPDATE lideres l
SET cadastros = (
  SELECT COUNT(*) 
  FROM office_contacts oc 
  WHERE oc.source_id = l.id 
    AND oc.source_type = 'lider'
    AND oc.is_active = true
);
