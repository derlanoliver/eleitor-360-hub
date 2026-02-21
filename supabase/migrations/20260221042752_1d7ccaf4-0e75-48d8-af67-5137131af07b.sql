
-- Add return request fields to material_reservations
ALTER TABLE public.material_reservations
  ADD COLUMN IF NOT EXISTS return_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_requested_quantity integer DEFAULT 0;
