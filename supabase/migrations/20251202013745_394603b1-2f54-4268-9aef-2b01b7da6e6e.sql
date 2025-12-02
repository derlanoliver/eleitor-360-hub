-- Criar tabela de organização
CREATE TABLE public.organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT 'Organização',
  cargo TEXT,
  partido TEXT,
  estado TEXT,
  cidade TEXT,
  bio TEXT,
  logo_url TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  twitter TEXT,
  youtube TEXT,
  whatsapp TEXT,
  email_contato TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;

-- Somente admins podem modificar
CREATE POLICY "organization_modify" ON public.organization
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Leitura pública
CREATE POLICY "organization_select" ON public.organization
  FOR SELECT USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_organization_updated_at
  BEFORE UPDATE ON public.organization
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir registro inicial
INSERT INTO public.organization (nome) VALUES ('Organização');

-- Expandir tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Criar bucket para avatares e logos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Políticas de storage para avatares
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);