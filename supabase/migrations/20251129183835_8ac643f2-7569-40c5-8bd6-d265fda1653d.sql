-- Adicionar campo tema_id à tabela office_visit_forms
ALTER TABLE office_visit_forms
ADD COLUMN tema_id uuid REFERENCES temas(id);

-- Criar função para incrementar cadastros do tema
CREATE OR REPLACE FUNCTION increment_tema_cadastros()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tema_id IS NOT NULL THEN
    UPDATE temas
    SET cadastros = cadastros + 1,
        updated_at = now()
    WHERE id = NEW.tema_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para incrementar automaticamente
CREATE TRIGGER trigger_increment_tema_cadastros
AFTER INSERT ON office_visit_forms
FOR EACH ROW
EXECUTE FUNCTION increment_tema_cadastros();