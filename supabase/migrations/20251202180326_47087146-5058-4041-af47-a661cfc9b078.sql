-- Adicionar colunas de configuração do formulário de líderes
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS leader_form_cover_url text,
ADD COLUMN IF NOT EXISTS leader_form_logo_url text,
ADD COLUMN IF NOT EXISTS leader_form_title text DEFAULT 'Cadastro de Liderança',
ADD COLUMN IF NOT EXISTS leader_form_subtitle text DEFAULT 'Faça parte da nossa rede de lideranças e contribua para transformar nossa região.';

-- RLS policy para permitir INSERT público na tabela lideres (auto-cadastro)
CREATE POLICY "lideres_insert_public_self_registration"
ON public.lideres
FOR INSERT
WITH CHECK (
  nome_completo IS NOT NULL 
  AND telefone IS NOT NULL 
  AND cidade_id IS NOT NULL
  AND is_active = true
);