-- 1. Adicionar colunas em integrations_settings
ALTER TABLE integrations_settings 
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'link',
ADD COLUMN IF NOT EXISTS verification_wa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_wa_test_mode BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS verification_wa_whitelist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS verification_wa_keyword TEXT DEFAULT 'CONFIRMAR',
ADD COLUMN IF NOT EXISTS verification_wa_zapi_phone TEXT;

-- 2. Criar tabela contact_verifications
CREATE TABLE IF NOT EXISTS contact_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type TEXT NOT NULL,
  contact_id UUID NOT NULL,
  method TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  keyword_received_at TIMESTAMPTZ,
  consent_question_sent_at TIMESTAMPTZ,
  consent_received_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  consent_text_version TEXT DEFAULT 'v1',
  consent_channel TEXT,
  consent_message_id TEXT
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_verifications_phone_status 
  ON contact_verifications(phone, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verifications_active_per_contact 
  ON contact_verifications(contact_type, contact_id) 
  WHERE status IN ('pending', 'keyword_received', 'awaiting_consent');

-- RLS
ALTER TABLE contact_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access" ON contact_verifications
  FOR SELECT USING (has_admin_access(auth.uid()));

CREATE POLICY "Insert from edge functions" ON contact_verifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update from edge functions" ON contact_verifications
  FOR UPDATE USING (true);

-- 3. RPC: Criar verificação WhatsApp
CREATE OR REPLACE FUNCTION create_whatsapp_verification(
  _contact_type TEXT,
  _contact_id UUID,
  _phone TEXT
) RETURNS TABLE(token TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token TEXT;
  _existing_token TEXT;
BEGIN
  -- Verificar se ja existe verificacao ativa (reutilizar token)
  SELECT cv.token INTO _existing_token
  FROM contact_verifications cv
  WHERE cv.contact_type = _contact_type 
    AND cv.contact_id = _contact_id
    AND cv.status IN ('pending', 'keyword_received', 'awaiting_consent')
  LIMIT 1;
  
  IF _existing_token IS NOT NULL THEN
    RETURN QUERY 
      SELECT _existing_token, now();
    RETURN;
  END IF;
  
  -- Cancelar verificacoes anteriores
  UPDATE contact_verifications
  SET status = 'cancelled'
  WHERE contact_type = _contact_type 
    AND contact_id = _contact_id
    AND status NOT IN ('verified', 'cancelled');
  
  -- Gerar token unico (6 caracteres)
  _token := upper(substring(md5(random()::text) from 1 for 6));
  
  -- Inserir nova verificacao
  INSERT INTO contact_verifications (
    contact_type, contact_id, method, token, phone
  ) VALUES (
    _contact_type, _contact_id, 'whatsapp_consent', _token, _phone
  );
  
  RETURN QUERY SELECT _token, now();
END;
$$;

-- 4. RPC: Processar keyword
CREATE OR REPLACE FUNCTION process_verification_keyword(
  _token TEXT,
  _phone TEXT
) RETURNS TABLE(
  success BOOLEAN,
  contact_type TEXT,
  contact_id UUID,
  contact_name TEXT,
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _verification RECORD;
  _name TEXT;
BEGIN
  -- Buscar verificacao ativa
  SELECT * INTO _verification
  FROM contact_verifications cv
  WHERE cv.token = upper(_token)
    AND cv.status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'invalid_token'::TEXT;
    RETURN;
  END IF;
  
  -- Atualizar status para awaiting_consent
  UPDATE contact_verifications
  SET status = 'awaiting_consent',
      keyword_received_at = now()
  WHERE id = _verification.id;
  
  -- Buscar nome
  IF _verification.contact_type = 'leader' THEN
    SELECT nome_completo INTO _name FROM lideres WHERE id = _verification.contact_id;
  ELSE
    SELECT nome INTO _name FROM office_contacts WHERE id = _verification.contact_id;
  END IF;
  
  RETURN QUERY SELECT true, _verification.contact_type, _verification.contact_id, _name, NULL::TEXT;
END;
$$;

-- 5. RPC: Processar consentimento
CREATE OR REPLACE FUNCTION process_verification_consent(
  _phone TEXT
) RETURNS TABLE(
  success BOOLEAN,
  contact_type TEXT,
  contact_id UUID,
  contact_name TEXT,
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _verification RECORD;
  _name TEXT;
BEGIN
  -- Buscar verificacao aguardando consentimento
  SELECT * INTO _verification
  FROM contact_verifications cv
  WHERE cv.phone = _phone
    AND cv.status = 'awaiting_consent'
  ORDER BY cv.created_at DESC
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'no_pending_consent'::TEXT;
    RETURN;
  END IF;
  
  -- Marcar como verificado
  UPDATE contact_verifications
  SET status = 'verified',
      consent_received_at = now(),
      verified_at = now(),
      consent_channel = 'whatsapp'
  WHERE id = _verification.id;
  
  -- Atualizar lider/contato
  IF _verification.contact_type = 'leader' THEN
    UPDATE lideres
    SET is_verified = true,
        verified_at = now(),
        verification_method = 'whatsapp_consent'
    WHERE id = _verification.contact_id;
    
    SELECT nome_completo INTO _name FROM lideres WHERE id = _verification.contact_id;
  ELSE
    UPDATE office_contacts
    SET is_verified = true,
        verified_at = now()
    WHERE id = _verification.contact_id;
    
    SELECT nome INTO _name FROM office_contacts WHERE id = _verification.contact_id;
  END IF;
  
  RETURN QUERY SELECT true, _verification.contact_type, _verification.contact_id, _name, NULL::TEXT;
END;
$$;