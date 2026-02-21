
-- Add return confirmation fields to material_reservations
ALTER TABLE public.material_reservations
  ADD COLUMN IF NOT EXISTS return_confirmation_code text,
  ADD COLUMN IF NOT EXISTS return_confirmed_via text,
  ADD COLUMN IF NOT EXISTS return_confirmed_at timestamptz;

-- Trigger to generate return confirmation code when returned_quantity > 0 and no code exists
CREATE OR REPLACE FUNCTION public.generate_return_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate return code when status is withdrawn and returned_quantity increases and no code yet
  IF NEW.status = 'withdrawn' AND NEW.return_confirmation_code IS NULL THEN
    NEW.return_confirmation_code := 'DEV' || UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 3));
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.material_reservations WHERE return_confirmation_code = NEW.return_confirmation_code AND id != NEW.id) LOOP
      NEW.return_confirmation_code := 'DEV' || UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 3));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Generate return code when reservation becomes withdrawn
CREATE OR REPLACE TRIGGER trg_generate_return_code
  BEFORE UPDATE ON public.material_reservations
  FOR EACH ROW
  WHEN (OLD.status = 'reserved' AND NEW.status = 'withdrawn')
  EXECUTE FUNCTION public.generate_return_confirmation_code();

-- Also generate for already-withdrawn reservations that don't have a code yet
UPDATE public.material_reservations
SET return_confirmation_code = 'DEV' || UPPER(SUBSTR(MD5(RANDOM()::TEXT || id::TEXT), 1, 3))
WHERE status = 'withdrawn' AND return_confirmation_code IS NULL;
