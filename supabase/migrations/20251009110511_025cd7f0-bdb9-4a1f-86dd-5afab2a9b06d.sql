-- =====================================================
-- FASE 3: CONSOLIDAÇÃO DE TABELAS lideres + office_leaders
-- =====================================================

-- 3.1. Expandir tabela lideres com novos campos
ALTER TABLE public.lideres 
  RENAME COLUMN nome TO nome_completo;

ALTER TABLE public.lideres
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS cidade_id UUID REFERENCES public.office_cities(id),
  ADD COLUMN IF NOT EXISTS status office_leader_status DEFAULT 'active'::office_leader_status NOT NULL,
  ADD COLUMN IF NOT EXISTS pontuacao_total INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3.2. Migrar dados de office_leaders para lideres (se houver)
INSERT INTO public.lideres (id, nome_completo, cidade_id, status, pontuacao_total, created_at, updated_at)
SELECT id, nome_completo, cidade_id, status, pontuacao_total, created_at, updated_at
FROM public.office_leaders
ON CONFLICT (id) DO NOTHING;

-- 3.3. Atualizar foreign keys de office_visits
ALTER TABLE public.office_visits
  DROP CONSTRAINT IF EXISTS office_visits_leader_id_fkey;

ALTER TABLE public.office_visits
  ADD CONSTRAINT office_visits_leader_id_fkey 
  FOREIGN KEY (leader_id) REFERENCES public.lideres(id);

-- 3.4. Atualizar trigger update_leader_score para usar lideres
DROP TRIGGER IF EXISTS update_office_leader_score ON public.office_visits;

CREATE OR REPLACE FUNCTION public.update_leader_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _settings RECORD;
  _form RECORD;
  _points INTEGER := 0;
BEGIN
  IF NEW.status IN ('FORM_SUBMITTED', 'CHECKED_IN') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('FORM_SUBMITTED', 'CHECKED_IN')) THEN
    
    SELECT pontos_form_submitted, pontos_aceita_reuniao
    INTO _settings
    FROM office_settings
    LIMIT 1;
    
    _points := COALESCE(_settings.pontos_form_submitted, 1);
    
    SELECT aceita_reuniao INTO _form
    FROM office_visit_forms
    WHERE visit_id = NEW.id;
    
    IF _form.aceita_reuniao THEN
      _points := _points + COALESCE(_settings.pontos_aceita_reuniao, 3);
    END IF;
    
    -- Atualizar pontuação na tabela lideres
    UPDATE lideres
    SET pontuacao_total = pontuacao_total + _points,
        last_activity = now()
    WHERE id = NEW.leader_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_leader_score_trigger
  AFTER UPDATE ON public.office_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leader_score();

-- 3.5. Dropar tabela office_leaders
DROP TABLE IF EXISTS public.office_leaders CASCADE;

-- 3.6. Atualizar RLS policies para lideres
DROP POLICY IF EXISTS lideres_all ON public.lideres;

CREATE POLICY "lideres_select" 
  ON public.lideres
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));

CREATE POLICY "lideres_modify" 
  ON public.lideres
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3.7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lideres_cidade_id ON public.lideres(cidade_id);
CREATE INDEX IF NOT EXISTS idx_lideres_status ON public.lideres(status);
CREATE INDEX IF NOT EXISTS idx_lideres_pontuacao ON public.lideres(pontuacao_total DESC);

COMMENT ON TABLE public.lideres IS 'Tabela unificada de líderes - serve tanto Gestão de Lideranças quanto Módulo Gabinete';