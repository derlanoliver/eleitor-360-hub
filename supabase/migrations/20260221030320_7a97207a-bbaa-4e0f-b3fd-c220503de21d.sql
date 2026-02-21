
-- Add return tracking columns to material_reservations
ALTER TABLE public.material_reservations 
  ADD COLUMN returned_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN returned_at timestamptz;

-- Trigger: when a reservation is marked as "withdrawn", set withdrawn_at
-- Trigger: when returned_quantity is updated, restore stock
CREATE OR REPLACE FUNCTION public.handle_reservation_withdrawal_and_return()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle withdrawal: status changed to "withdrawn"
  IF NEW.status = 'withdrawn' AND OLD.status = 'reserved' THEN
    NEW.withdrawn_at = COALESCE(NEW.withdrawn_at, now());
  END IF;

  -- Handle return: returned_quantity increased
  IF NEW.returned_quantity > OLD.returned_quantity THEN
    NEW.returned_at = now();
    -- Restore returned amount to stock
    UPDATE public.campaign_materials
    SET estoque_atual = estoque_atual + (NEW.returned_quantity - OLD.returned_quantity),
        updated_at = now()
    WHERE id = NEW.material_id;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_reservation_withdrawal_return
  BEFORE UPDATE ON public.material_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reservation_withdrawal_and_return();
