-- Corrigir a RPC process_verification_consent para normalizar o telefone antes de buscar
-- O problema é que contact_verifications.phone armazena com "+" mas o webhook envia sem

CREATE OR REPLACE FUNCTION public.process_verification_consent(_phone text)
 RETURNS TABLE(success boolean, contact_type text, contact_id uuid, contact_name text, error_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _verification RECORD;
  _name TEXT;
  _normalized_phone TEXT;
BEGIN
  -- Normalizar telefone: garantir formato +XXXXXXXXXXX
  _normalized_phone := regexp_replace(_phone, '[^0-9]', '', 'g');
  IF NOT _normalized_phone LIKE '+%' THEN
    _normalized_phone := '+' || _normalized_phone;
  END IF;
  
  -- Buscar verificacao aguardando consentimento
  -- Tentar encontrar pelo telefone normalizado ou original
  SELECT * INTO _verification
  FROM contact_verifications cv
  WHERE (cv.phone = _normalized_phone 
         OR cv.phone = _phone 
         OR cv.phone = '+' || regexp_replace(_phone, '[^0-9]', '', 'g')
         OR regexp_replace(cv.phone, '[^0-9]', '', 'g') = regexp_replace(_phone, '[^0-9]', '', 'g'))
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
$function$;