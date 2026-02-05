CREATE OR REPLACE FUNCTION public.process_verification_consent(_phone TEXT)
RETURNS TABLE(success BOOLEAN, contact_type TEXT, contact_id UUID, contact_name TEXT, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _verification RECORD;
  _name TEXT;
  _normalized_phone TEXT;
  _digits_only TEXT;
  _last_8_digits TEXT;
BEGIN
  -- Normalizar telefone: remover tudo exceto dígitos
  _digits_only := regexp_replace(_phone, '[^0-9]', '', 'g');
  _normalized_phone := '+' || _digits_only;
  _last_8_digits := RIGHT(_digits_only, 8);
  
  -- Buscar verificacao aguardando consentimento
  -- Prioridade: match exato de dígitos, depois match pelos últimos 8 dígitos
  SELECT * INTO _verification
  FROM contact_verifications cv
  WHERE cv.status = 'awaiting_consent'
    AND (
      -- Match exato por dígitos (ignora formatação)
      regexp_replace(cv.phone, '[^0-9]', '', 'g') = _digits_only
      -- Match pelos últimos 8 dígitos (resolve problema do 9 faltando)
      OR RIGHT(regexp_replace(cv.phone, '[^0-9]', '', 'g'), 8) = _last_8_digits
    )
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