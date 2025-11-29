-- Adicionar campos de QR Code e Check-in na tabela office_visits
ALTER TABLE office_visits 
ADD COLUMN qr_code TEXT UNIQUE,
ADD COLUMN checked_in BOOLEAN DEFAULT false,
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE;

-- Função para gerar QR Code único (similar aos eventos)
CREATE OR REPLACE FUNCTION generate_visit_qr_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
  _exists BOOLEAN;
BEGIN
  LOOP
    _code := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
    SELECT EXISTS(SELECT 1 FROM office_visits WHERE qr_code = _code) INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;
  RETURN _code;
END;
$$;

-- Trigger para gerar QR Code automaticamente quando status muda para FORM_SUBMITTED
CREATE OR REPLACE FUNCTION set_visit_qr_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'FORM_SUBMITTED' AND NEW.qr_code IS NULL THEN
    NEW.qr_code := generate_visit_qr_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_visit_qr_code
BEFORE UPDATE ON office_visits
FOR EACH ROW EXECUTE FUNCTION set_visit_qr_code();