-- Adicionar coluna para rastrear quando o cartão foi invalidado
ALTER TABLE public.lideres 
ADD COLUMN IF NOT EXISTS passkit_invalidated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;