
-- Create material_reservations table
CREATE TABLE public.material_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.campaign_materials(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES public.lideres(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved', -- reserved, withdrawn, expired, cancelled
  reserved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '3 days'),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_reservations ENABLE ROW LEVEL SECURITY;

-- Policies: super_admin full access
CREATE POLICY "material_reservations_modify"
ON public.material_reservations
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Public select for coordinators (they see their own)
CREATE POLICY "material_reservations_select_public"
ON public.material_reservations
FOR SELECT
USING (true);

-- Public insert (coordinator portal inserts without auth)
CREATE POLICY "material_reservations_insert_public"
ON public.material_reservations
FOR INSERT
WITH CHECK (true);

-- Public update for cancellation
CREATE POLICY "material_reservations_update_public"
ON public.material_reservations
FOR UPDATE
USING (true);

-- Trigger: deduct stock on reservation, restore on expiry/cancellation
CREATE OR REPLACE FUNCTION public.handle_reservation_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Deduct from stock
    UPDATE public.campaign_materials
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.material_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed to expired or cancelled, restore stock
    IF OLD.status = 'reserved' AND NEW.status IN ('expired', 'cancelled') THEN
      UPDATE public.campaign_materials
      SET estoque_atual = estoque_atual + OLD.quantidade
      WHERE id = OLD.material_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_reservation_stock
AFTER INSERT OR UPDATE ON public.material_reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_stock();

-- Function to expire old reservations (called by cron)
CREATE OR REPLACE FUNCTION public.expire_material_reservations()
RETURNS void AS $$
BEGIN
  UPDATE public.material_reservations
  SET status = 'expired', cancelled_at = now(), updated_at = now()
  WHERE status = 'reserved' AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
