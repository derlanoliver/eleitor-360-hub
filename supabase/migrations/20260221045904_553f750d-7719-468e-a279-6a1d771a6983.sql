ALTER TABLE public.material_reservations
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'reservation';