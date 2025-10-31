-- Adicionar coluna affiliate_token à tabela lideres
ALTER TABLE lideres
ADD COLUMN affiliate_token TEXT UNIQUE;

-- Criar índice para busca rápida por token
CREATE INDEX idx_lideres_affiliate_token ON lideres(affiliate_token);

-- Função para gerar token aleatório (8 caracteres alfanuméricos)
CREATE OR REPLACE FUNCTION generate_leader_affiliate_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  _token TEXT;
  _exists BOOLEAN;
BEGIN
  LOOP
    _token := substring(md5(random()::text || clock_timestamp()::text) from 1 for 8);
    
    SELECT EXISTS(SELECT 1 FROM lideres WHERE affiliate_token = _token) INTO _exists;
    
    EXIT WHEN NOT _exists;
  END LOOP;
  
  RETURN _token;
END;
$$;

-- Trigger para gerar token automaticamente ao criar líder
CREATE OR REPLACE FUNCTION set_leader_affiliate_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.affiliate_token IS NULL THEN
    NEW.affiliate_token := generate_leader_affiliate_token();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_leader_affiliate_token
BEFORE INSERT ON lideres
FOR EACH ROW
EXECUTE FUNCTION set_leader_affiliate_token();

-- Popular tokens para líderes existentes
UPDATE lideres
SET affiliate_token = generate_leader_affiliate_token()
WHERE affiliate_token IS NULL;

-- Criar política RLS para permitir consulta pública de líder por affiliate_token
CREATE POLICY "lideres_select_by_affiliate_token"
ON lideres
FOR SELECT
TO anon
USING (affiliate_token IS NOT NULL AND is_active = true);