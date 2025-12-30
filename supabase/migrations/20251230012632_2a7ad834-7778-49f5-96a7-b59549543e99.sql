-- Criar tabela para rastrear sessões ativas
CREATE TABLE public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT false,
  force_logout_at TIMESTAMPTZ,
  force_logout_reason TEXT
);

-- Habilitar RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (usuário vê apenas suas sessões)
CREATE POLICY "Users can view own sessions" 
  ON public.active_sessions FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" 
  ON public.active_sessions FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" 
  ON public.active_sessions FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" 
  ON public.active_sessions FOR DELETE 
  USING (user_id = auth.uid());

-- Índices para performance
CREATE INDEX idx_active_sessions_user ON public.active_sessions(user_id);
CREATE INDEX idx_active_sessions_session ON public.active_sessions(session_id);

-- Habilitar Realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;