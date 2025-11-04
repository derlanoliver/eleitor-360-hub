-- Criar índices para melhorar performance de validação
CREATE INDEX IF NOT EXISTS idx_office_contacts_source_lider 
ON office_contacts(source_id) 
WHERE source_type = 'lider';

CREATE INDEX IF NOT EXISTS idx_office_contacts_source_campanha 
ON office_contacts(source_id) 
WHERE source_type = 'campanha';

-- Criar função para validar integridade de source_id
CREATE OR REPLACE FUNCTION validate_office_contact_source()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_type = 'lider' AND NEW.source_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM lideres WHERE id = NEW.source_id) THEN
      RAISE EXCEPTION 'Líder com ID % não existe', NEW.source_id;
    END IF;
  ELSIF NEW.source_type = 'campanha' AND NEW.source_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM campaigns WHERE id = NEW.source_id) THEN
      RAISE EXCEPTION 'Campanha com ID % não existe', NEW.source_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para validação
CREATE TRIGGER validate_office_contact_source_trigger
  BEFORE INSERT OR UPDATE ON office_contacts
  FOR EACH ROW
  EXECUTE FUNCTION validate_office_contact_source();