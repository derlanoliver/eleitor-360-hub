-- 1. Desativar contatos duplicados que já são líderes ativos
UPDATE office_contacts oc
SET is_active = false, 
    updated_at = now()
WHERE oc.source_type = 'lider'
  AND oc.is_active = true
  AND EXISTS (
    SELECT 1 FROM lideres l 
    WHERE l.is_active = true
    AND l.telefone IS NOT NULL
    AND normalize_phone_e164(l.telefone) = oc.telefone_norm
  );

-- 2. Recalcular campo cadastros de todos os líderes baseado apenas em contatos únicos e ativos
UPDATE lideres l
SET cadastros = (
  SELECT COUNT(*) 
  FROM office_contacts oc 
  WHERE oc.source_type = 'lider' 
    AND oc.source_id::uuid = l.id 
    AND oc.is_active = true
),
    updated_at = now();

-- 3. Criar função para desativar contato quando líder é criado com mesmo telefone
CREATE OR REPLACE FUNCTION deactivate_contact_on_leader_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Desativar contatos que têm o mesmo telefone do novo líder
  IF NEW.telefone IS NOT NULL THEN
    UPDATE office_contacts
    SET is_active = false, updated_at = now()
    WHERE telefone_norm = normalize_phone_e164(NEW.telefone)
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Criar trigger para executar após inserção de novo líder
DROP TRIGGER IF EXISTS trigger_deactivate_contact_on_leader ON lideres;
CREATE TRIGGER trigger_deactivate_contact_on_leader
AFTER INSERT ON lideres
FOR EACH ROW
EXECUTE FUNCTION deactivate_contact_on_leader_creation();