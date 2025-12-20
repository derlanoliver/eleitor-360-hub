-- =============================================
-- WHATSAPP CHATBOT TABLES
-- =============================================

-- 1. Tabela de configuração do chatbot
CREATE TABLE IF NOT EXISTS public.whatsapp_chatbot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  use_ai_for_unknown BOOLEAN NOT NULL DEFAULT true,
  welcome_message TEXT DEFAULT 'Olá! Sou o assistente virtual. Como posso ajudar?',
  fallback_message TEXT DEFAULT 'Desculpe, não entendi sua mensagem. Digite AJUDA para ver os comandos disponíveis.',
  ai_system_prompt TEXT DEFAULT 'Você é um assistente virtual amigável que ajuda líderes a consultar informações sobre sua rede de contatos e pontuação.',
  max_messages_per_hour INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de palavras-chave do chatbot
CREATE TABLE IF NOT EXISTS public.whatsapp_chatbot_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  response_type TEXT NOT NULL DEFAULT 'static' CHECK (response_type IN ('static', 'dynamic', 'ai')),
  static_response TEXT,
  dynamic_function TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de logs do chatbot
CREATE TABLE IF NOT EXISTS public.whatsapp_chatbot_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id UUID REFERENCES public.lideres(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message_in TEXT NOT NULL,
  message_out TEXT,
  keyword_matched TEXT,
  response_type TEXT,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE public.whatsapp_chatbot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_chatbot_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_chatbot_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - CONFIG
-- =============================================
CREATE POLICY "whatsapp_chatbot_config_select" ON public.whatsapp_chatbot_config
  FOR SELECT USING (has_admin_access(auth.uid()));

CREATE POLICY "whatsapp_chatbot_config_modify" ON public.whatsapp_chatbot_config
  FOR ALL USING (has_admin_access(auth.uid())) WITH CHECK (has_admin_access(auth.uid()));

-- =============================================
-- RLS POLICIES - KEYWORDS
-- =============================================
CREATE POLICY "whatsapp_chatbot_keywords_select" ON public.whatsapp_chatbot_keywords
  FOR SELECT USING (has_admin_access(auth.uid()));

CREATE POLICY "whatsapp_chatbot_keywords_modify" ON public.whatsapp_chatbot_keywords
  FOR ALL USING (has_admin_access(auth.uid())) WITH CHECK (has_admin_access(auth.uid()));

-- =============================================
-- RLS POLICIES - LOGS
-- =============================================
CREATE POLICY "whatsapp_chatbot_logs_select" ON public.whatsapp_chatbot_logs
  FOR SELECT USING (has_admin_access(auth.uid()));

CREATE POLICY "whatsapp_chatbot_logs_insert_public" ON public.whatsapp_chatbot_logs
  FOR INSERT WITH CHECK (true);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_chatbot_keywords_keyword ON public.whatsapp_chatbot_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_chatbot_keywords_active ON public.whatsapp_chatbot_keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_leader ON public.whatsapp_chatbot_logs(leader_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_created ON public.whatsapp_chatbot_logs(created_at DESC);

-- =============================================
-- INITIAL DATA - CONFIG
-- =============================================
INSERT INTO public.whatsapp_chatbot_config (
  is_enabled,
  use_ai_for_unknown,
  welcome_message,
  fallback_message,
  ai_system_prompt,
  max_messages_per_hour
) VALUES (
  false,
  true,
  'Olá! Sou o assistente virtual do gabinete. Posso ajudar você a consultar informações sobre sua rede de lideranças. Digite AJUDA para ver os comandos disponíveis.',
  'Desculpe, não entendi sua mensagem. Digite AJUDA para ver os comandos disponíveis.',
  'Você é um assistente virtual amigável e profissional de um gabinete político. Você ajuda líderes a consultar informações sobre sua rede de contatos, pontuação e ranking. Seja conciso e direto nas respostas. Responda sempre em português brasileiro.',
  30
) ON CONFLICT DO NOTHING;

-- =============================================
-- INITIAL DATA - KEYWORDS
-- =============================================
INSERT INTO public.whatsapp_chatbot_keywords (keyword, aliases, description, response_type, dynamic_function, priority, is_active) VALUES
('ARVORE', ARRAY['MINHA ARVORE', 'REDE', 'MINHA REDE', 'HIERARQUIA'], 'Mostra a árvore de lideranças do líder', 'dynamic', 'minha_arvore', 10, true),
('CADASTROS', ARRAY['MEUS CADASTROS', 'INDICADOS', 'MEUS INDICADOS', 'CONTATOS'], 'Mostra os contatos indicados pelo líder', 'dynamic', 'meus_cadastros', 10, true),
('PONTOS', ARRAY['PONTUACAO', 'MINHA PONTUACAO', 'MEUS PONTOS', 'SCORE'], 'Mostra a pontuação total do líder', 'dynamic', 'minha_pontuacao', 10, true),
('RANKING', ARRAY['POSICAO', 'MINHA POSICAO', 'CLASSIFICACAO'], 'Mostra a posição do líder no ranking geral', 'dynamic', 'minha_posicao', 10, true),
('SUBORDINADOS', ARRAY['MEUS SUBORDINADOS', 'EQUIPE', 'MINHA EQUIPE', 'TIME'], 'Mostra os subordinados diretos do líder', 'dynamic', 'meus_subordinados', 10, true),
('AJUDA', ARRAY['HELP', 'COMANDOS', 'MENU', 'OPCOES', '?'], 'Mostra os comandos disponíveis', 'dynamic', 'ajuda', 100, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.update_chatbot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_whatsapp_chatbot_config_updated_at
  BEFORE UPDATE ON public.whatsapp_chatbot_config
  FOR EACH ROW EXECUTE FUNCTION public.update_chatbot_updated_at();

CREATE TRIGGER update_whatsapp_chatbot_keywords_updated_at
  BEFORE UPDATE ON public.whatsapp_chatbot_keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_chatbot_updated_at();