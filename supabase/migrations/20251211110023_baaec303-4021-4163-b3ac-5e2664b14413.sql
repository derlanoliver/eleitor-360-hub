-- Add checkin_pin column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS checkin_pin TEXT;

-- Create function to generate random 6-digit PIN
CREATE OR REPLACE FUNCTION public.generate_checkin_pin()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Update existing events with PINs
UPDATE public.events SET checkin_pin = generate_checkin_pin() WHERE checkin_pin IS NULL;

-- Create trigger to auto-generate PIN on insert
CREATE OR REPLACE FUNCTION public.set_checkin_pin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checkin_pin IS NULL THEN
    NEW.checkin_pin := generate_checkin_pin();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_checkin_pin ON public.events;
CREATE TRIGGER trigger_set_checkin_pin
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_checkin_pin();

-- Create RPC to validate PIN (public access, no auth required)
CREATE OR REPLACE FUNCTION public.validate_checkin_pin(_event_id UUID, _pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  valid BOOLEAN;
BEGIN
  SELECT (checkin_pin = _pin) INTO valid
  FROM public.events
  WHERE id = _event_id;
  
  RETURN COALESCE(valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;