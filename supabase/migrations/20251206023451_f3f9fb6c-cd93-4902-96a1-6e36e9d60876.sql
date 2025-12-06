-- Adicionar colunas de gamificação à tabela office_settings
ALTER TABLE public.office_settings 
  ADD COLUMN IF NOT EXISTS limite_eventos_dia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivel_bronze_min INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivel_bronze_max INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS nivel_prata_min INTEGER DEFAULT 11,
  ADD COLUMN IF NOT EXISTS nivel_prata_max INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS nivel_ouro_min INTEGER DEFAULT 31,
  ADD COLUMN IF NOT EXISTS nivel_ouro_max INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS nivel_diamante_min INTEGER DEFAULT 51;

-- Atualizar o registro existente com valores padrão
UPDATE public.office_settings SET
  limite_eventos_dia = COALESCE(limite_eventos_dia, 0),
  nivel_bronze_min = COALESCE(nivel_bronze_min, 0),
  nivel_bronze_max = COALESCE(nivel_bronze_max, 10),
  nivel_prata_min = COALESCE(nivel_prata_min, 11),
  nivel_prata_max = COALESCE(nivel_prata_max, 30),
  nivel_ouro_min = COALESCE(nivel_ouro_min, 31),
  nivel_ouro_max = COALESCE(nivel_ouro_max, 50),
  nivel_diamante_min = COALESCE(nivel_diamante_min, 51);