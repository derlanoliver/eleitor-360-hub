
CREATE TABLE IF NOT EXISTS public.coordinator_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id uuid NOT NULL UNIQUE REFERENCES public.lideres(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coordinator_credentials ENABLE ROW LEVEL SECURITY;

-- No direct access; all operations via SECURITY DEFINER RPCs
CREATE POLICY "No direct access" ON public.coordinator_credentials FOR SELECT USING (false);
