-- Limpar dados existentes da tabela lideres
DELETE FROM public.lideres;

-- Adicionar constraint UNIQUE ao campo email
ALTER TABLE public.lideres
ADD CONSTRAINT lideres_email_unique UNIQUE (email);