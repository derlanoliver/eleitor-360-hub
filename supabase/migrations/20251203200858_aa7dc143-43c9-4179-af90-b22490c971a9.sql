-- Create programas table
CREATE TABLE public.programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  inicio DATE NOT NULL,
  impacto INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "programas_select" ON public.programas 
FOR SELECT USING (true);

-- Admin modify access
CREATE POLICY "programas_modify" ON public.programas 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_programas_updated_at
  BEFORE UPDATE ON public.programas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial data from existing JSON
INSERT INTO public.programas (nome, descricao, status, inicio, impacto) VALUES
('DF no Rumo Certo', 'Programa de desenvolvimento urbano e infraestrutura para comunidades carentes', 'Ativo', '2024-03-01', 1420),
('Saúde em Ação', 'Mutirões de saúde e atendimento médico gratuito', 'Ativo', '2024-02-01', 1980),
('Educação para Todos', 'Bolsas de estudo e cursos profissionalizantes', 'Ativo', '2024-01-01', 2250),
('Esporte na Comunidade', 'Escolinhas de esporte e eventos esportivos', 'Ativo', '2023-12-01', 890),
('Cultura Viva', 'Apoio a artistas locais e eventos culturais', 'Em Planejamento', '2024-06-01', 0),
('Verde Brasília', 'Plantio de árvores e educação ambiental', 'Ativo', '2024-04-01', 450);