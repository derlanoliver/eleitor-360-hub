-- Add is_demo flag to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.is_demo IS 'When true, all sensitive data is masked for presentation/demo purposes';