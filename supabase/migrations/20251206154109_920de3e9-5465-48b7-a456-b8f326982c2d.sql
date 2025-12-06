-- Tabela para salvar análises do mapa estratégico
CREATE TABLE public.map_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  total_leaders INTEGER,
  total_contacts INTEGER,
  total_connections INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.map_analyses ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas admins podem acessar
CREATE POLICY "map_analyses_select_admin" ON public.map_analyses
  FOR SELECT TO authenticated
  USING (has_admin_access(auth.uid()));

CREATE POLICY "map_analyses_insert_admin" ON public.map_analyses
  FOR INSERT TO authenticated
  WITH CHECK (has_admin_access(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "map_analyses_delete_admin" ON public.map_analyses
  FOR DELETE TO authenticated
  USING (has_admin_access(auth.uid()));