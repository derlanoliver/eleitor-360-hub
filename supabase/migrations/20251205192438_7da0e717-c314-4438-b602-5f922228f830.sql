-- Add platform name field to organization table
ALTER TABLE public.organization 
ADD COLUMN IF NOT EXISTS nome_plataforma text DEFAULT 'Minha Plataforma';