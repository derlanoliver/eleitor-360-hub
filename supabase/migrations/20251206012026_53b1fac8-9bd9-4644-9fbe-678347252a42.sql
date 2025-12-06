-- Remover constraint antigo
ALTER TABLE office_contacts 
DROP CONSTRAINT IF EXISTS office_contacts_source_type_check;

-- Adicionar novo constraint incluindo 'webhook'
ALTER TABLE office_contacts 
ADD CONSTRAINT office_contacts_source_type_check 
CHECK (source_type = ANY (ARRAY['lider', 'campanha', 'evento', 'afiliado', 'manual', 'captacao', 'visita', 'webhook']));