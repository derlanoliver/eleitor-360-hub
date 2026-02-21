
-- Add confirmation tracking columns to material_reservations
ALTER TABLE public.material_reservations
  ADD COLUMN IF NOT EXISTS confirmation_code text,
  ADD COLUMN IF NOT EXISTS confirmed_via text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Create unique index on confirmation_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_reservations_confirmation_code 
  ON public.material_reservations (confirmation_code) WHERE confirmation_code IS NOT NULL;

-- Function to auto-generate confirmation code on insert
CREATE OR REPLACE FUNCTION public.generate_reservation_confirmation_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 6-char alphanumeric code: RET + 3 random chars
    new_code := 'RET' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 3));
    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM public.material_reservations WHERE confirmation_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.confirmation_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate code on insert
DROP TRIGGER IF EXISTS trg_generate_reservation_code ON public.material_reservations;
CREATE TRIGGER trg_generate_reservation_code
  BEFORE INSERT ON public.material_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_reservation_confirmation_code();

-- Backfill existing reservations that don't have a code
DO $$
DECLARE
  r RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  FOR r IN SELECT id FROM public.material_reservations WHERE confirmation_code IS NULL LOOP
    LOOP
      new_code := 'RET' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 3));
      SELECT EXISTS(SELECT 1 FROM public.material_reservations WHERE confirmation_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.material_reservations SET confirmation_code = new_code WHERE id = r.id;
  END LOOP;
END $$;
