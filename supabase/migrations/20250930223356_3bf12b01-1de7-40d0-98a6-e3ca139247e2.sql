-- Criar tabela de Regiões Administrativas
CREATE TABLE public.cadastros_ra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ra TEXT NOT NULL,
  cadastros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de Coordenadores
CREATE TABLE public.coordenadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cadastros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de Temas de Interesse
CREATE TABLE public.temas_interesse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema TEXT NOT NULL,
  cadastros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de Perfil Demográfico
CREATE TABLE public.perfil_demografico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genero TEXT NOT NULL,
  valor INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir dados de Regiões Administrativas
INSERT INTO public.cadastros_ra (ra, cadastros) VALUES
  ('Ceilândia', 412),
  ('Taguatinga', 331),
  ('Águas Claras', 288),
  ('Samambaia', 260),
  ('Plano Piloto', 215),
  ('Gama', 190),
  ('Guará', 176),
  ('Sobradinho', 154),
  ('Planaltina', 142),
  ('Santa Maria', 121);

-- Inserir dados de Coordenadores
INSERT INTO public.coordenadores (nome, cadastros) VALUES
  ('MIRIAM', 270),
  ('AUGUSTO', 67),
  ('VANDERLEI', 64),
  ('BOCA', 48),
  ('LUANA LIRA', 39),
  ('CRISTIANO MACHADO', 38),
  ('GOLD', 36),
  ('ANEILTON', 36),
  ('BARAUNA', 33),
  ('RITA', 32);

-- Inserir dados de Temas de Interesse
INSERT INTO public.temas_interesse (tema, cadastros) VALUES
  ('Saúde', 510),
  ('Educação', 420),
  ('Segurança', 388),
  ('Mobilidade', 342),
  ('Emprego', 295),
  ('Infraestrutura', 240),
  ('Habitação', 210),
  ('Cultura', 188),
  ('Meio Ambiente', 160),
  ('Mulheres', 140);

-- Inserir dados de Perfil Demográfico
INSERT INTO public.perfil_demografico (genero, valor) VALUES
  ('Feminino', 56),
  ('Masculino', 44);

-- Habilitar RLS nas tabelas
ALTER TABLE public.cadastros_ra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordenadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temas_interesse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_demografico ENABLE ROW LEVEL SECURITY;

-- Criar políticas de leitura pública (para o agente IA consultar)
CREATE POLICY "Permitir leitura pública de cadastros_ra"
  ON public.cadastros_ra FOR SELECT
  USING (true);

CREATE POLICY "Permitir leitura pública de coordenadores"
  ON public.coordenadores FOR SELECT
  USING (true);

CREATE POLICY "Permitir leitura pública de temas_interesse"
  ON public.temas_interesse FOR SELECT
  USING (true);

CREATE POLICY "Permitir leitura pública de perfil_demografico"
  ON public.perfil_demografico FOR SELECT
  USING (true);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
CREATE TRIGGER update_cadastros_ra_updated_at
  BEFORE UPDATE ON public.cadastros_ra
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coordenadores_updated_at
  BEFORE UPDATE ON public.coordenadores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_temas_interesse_updated_at
  BEFORE UPDATE ON public.temas_interesse
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();