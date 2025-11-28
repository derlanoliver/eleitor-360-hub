-- Corrigir warnings de segurança: adicionar search_path nas funções

-- Recriar função normalize_phone_e164 com search_path
CREATE OR REPLACE FUNCTION normalize_phone_e164(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_phone text;
  normalized text;
BEGIN
  -- Remove todos os caracteres não numéricos
  clean_phone := regexp_replace(phone, '[^0-9]', '', 'g');
  
  -- Se já tem +55, remove para processar
  IF clean_phone LIKE '55%' THEN
    clean_phone := substring(clean_phone from 3);
  END IF;
  
  -- Corrige erros comuns do formato 5506
  IF length(clean_phone) = 12 AND substring(clean_phone from 1 for 4) = '5506' THEN
    clean_phone := '61' || substring(clean_phone from 5);
  END IF;
  
  -- Adiciona 9 se faltando (Brasília)
  IF length(clean_phone) = 10 AND substring(clean_phone from 1 for 2) = '61' THEN
    clean_phone := '61' || '9' || substring(clean_phone from 3);
  END IF;
  
  -- Adiciona DDD 61 se for só o número
  IF length(clean_phone) = 9 THEN
    clean_phone := '61' || clean_phone;
  ELSIF length(clean_phone) = 8 THEN
    clean_phone := '61' || '9' || clean_phone;
  END IF;
  
  -- Retorna no formato E.164
  IF length(clean_phone) = 11 THEN
    RETURN '+55' || clean_phone;
  END IF;
  
  -- Se não conseguiu normalizar, retorna o original com +55
  RETURN '+55' || clean_phone;
END;
$$;