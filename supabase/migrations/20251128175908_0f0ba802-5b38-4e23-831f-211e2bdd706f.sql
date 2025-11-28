-- Fix security warnings: Add search_path to functions

-- Fix generate_event_qr_code function
CREATE OR REPLACE FUNCTION generate_event_qr_code()
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
    
    SELECT EXISTS(SELECT 1 FROM event_registrations WHERE qr_code = _code) INTO _exists;
    
    EXIT WHEN NOT _exists;
  END LOOP;
  
  RETURN _code;
END;
$$;