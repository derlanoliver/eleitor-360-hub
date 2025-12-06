-- Tabela principal de pesquisas
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, closed
  data_inicio DATE,
  data_fim DATE,
  total_respostas INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  logo_url TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de perguntas da pesquisa
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  tipo TEXT NOT NULL, -- multipla_escolha, escala, nps, texto_curto, texto_longo, sim_nao
  pergunta TEXT NOT NULL,
  opcoes JSONB, -- para múltipla escolha: ["Opção 1", "Opção 2"]
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de respostas
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.office_contacts(id) ON DELETE SET NULL,
  leader_id UUID REFERENCES public.lideres(id) ON DELETE SET NULL, -- se quem respondeu é líder
  referred_by_leader_id UUID REFERENCES public.lideres(id) ON DELETE SET NULL, -- líder que indicou
  respostas JSONB NOT NULL DEFAULT '{}', -- { "question_id": "resposta" }
  is_leader BOOLEAN NOT NULL DEFAULT false,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_contact_id ON public.survey_responses(contact_id);
CREATE INDEX idx_survey_responses_leader_id ON public.survey_responses(leader_id);
CREATE INDEX idx_survey_responses_referred_by ON public.survey_responses(referred_by_leader_id);
CREATE INDEX idx_surveys_slug ON public.surveys(slug);
CREATE INDEX idx_surveys_status ON public.surveys(status);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surveys
CREATE POLICY "surveys_select_public" ON public.surveys
  FOR SELECT USING (status = 'active');

CREATE POLICY "surveys_select_admin" ON public.surveys
  FOR SELECT USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "surveys_modify" ON public.surveys
  FOR ALL USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));

-- RLS Policies for survey_questions
CREATE POLICY "survey_questions_select_public" ON public.survey_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND status = 'active')
  );

CREATE POLICY "survey_questions_select_admin" ON public.survey_questions
  FOR SELECT USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "survey_questions_modify" ON public.survey_questions
  FOR ALL USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));

-- RLS Policies for survey_responses
CREATE POLICY "survey_responses_insert_public" ON public.survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "survey_responses_select_admin" ON public.survey_responses
  FOR SELECT USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "survey_responses_delete_admin" ON public.survey_responses
  FOR DELETE USING (has_admin_access(auth.uid()));

-- Function to generate survey slug
CREATE OR REPLACE FUNCTION public.generate_survey_slug(base_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slug TEXT;
  _counter INTEGER := 0;
  _exists BOOLEAN;
BEGIN
  _slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  _slug := trim(both '-' from _slug);
  
  LOOP
    IF _counter = 0 THEN
      SELECT EXISTS(SELECT 1 FROM surveys WHERE slug = _slug) INTO _exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM surveys WHERE slug = _slug || '-' || _counter) INTO _exists;
    END IF;
    
    EXIT WHEN NOT _exists;
    _counter := _counter + 1;
  END LOOP;
  
  IF _counter > 0 THEN
    _slug := _slug || '-' || _counter;
  END IF;
  
  RETURN _slug;
END;
$$;

-- Function to increment survey response count
CREATE OR REPLACE FUNCTION public.increment_survey_responses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE surveys
  SET total_respostas = total_respostas + 1,
      updated_at = now()
  WHERE id = NEW.survey_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_increment_survey_responses
  AFTER INSERT ON public.survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_survey_responses();

-- Function to award points for survey responses
CREATE OR REPLACE FUNCTION public.score_survey_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se quem respondeu é líder: +1 ponto
  IF NEW.is_leader = true AND NEW.leader_id IS NOT NULL THEN
    PERFORM award_leader_points(NEW.leader_id, 1, 'resposta_pesquisa');
  END IF;
  
  -- Se foi indicado por um líder e não é líder: +2 pontos para o líder indicador
  IF NEW.referred_by_leader_id IS NOT NULL AND NEW.is_leader = false THEN
    PERFORM award_leader_points(NEW.referred_by_leader_id, 2, 'indicacao_pesquisa');
    PERFORM increment_leader_cadastros(NEW.referred_by_leader_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_score_survey_response
  AFTER INSERT ON public.survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.score_survey_response();

-- Trigger for updated_at on surveys
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert WhatsApp templates for surveys
INSERT INTO public.whatsapp_templates (slug, nome, mensagem, categoria, variaveis) VALUES
('pesquisa-convite', 'Convite para Pesquisa', 'Olá, {{nome}}! 👋

Você foi convidado(a) a participar de uma pesquisa importante: *{{pesquisa_titulo}}*

Sua opinião é fundamental para construirmos juntos um futuro melhor para nossa região.

🔗 Responda agora: {{link_pesquisa}}

A pesquisa leva apenas alguns minutos. Contamos com você!', 'pesquisa', '["nome", "pesquisa_titulo", "link_pesquisa"]'),
('pesquisa-agradecimento', 'Agradecimento Pesquisa', 'Obrigado, {{nome}}! 🙏

Sua participação na pesquisa "{{pesquisa_titulo}}" foi registrada com sucesso.

Sua opinião é muito importante e será considerada em nossas decisões.

Juntos somos mais fortes! 💪', 'pesquisa', '["nome", "pesquisa_titulo"]');

-- Insert Email templates for surveys
INSERT INTO public.email_templates (slug, nome, assunto, conteudo_html, categoria, variaveis) VALUES
('pesquisa-convite', 'Convite para Pesquisa', 'Sua opinião importa! Participe: {{pesquisa_titulo}}', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a56db; margin-bottom: 10px;">Sua Opinião Importa!</h1>
  </div>
  
  <p>Olá, <strong>{{nome}}</strong>!</p>
  
  <p>Você foi convidado(a) a participar de uma pesquisa muito importante:</p>
  
  <div style="background: linear-gradient(135deg, #1a56db 0%, #3b82f6 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
    <h2 style="color: white; margin: 0;">{{pesquisa_titulo}}</h2>
  </div>
  
  <p>Sua opinião é fundamental para construirmos juntos um futuro melhor para nossa região. A pesquisa leva apenas alguns minutos.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{link_pesquisa}}" style="background: #1a56db; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Responder Pesquisa</a>
  </div>
  
  <p>Contamos com você!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #666; text-align: center;">
    Se você não deseja mais receber nossos emails, <a href="{{link_descadastro}}" style="color: #1a56db;">clique aqui para se descadastrar</a>.
  </p>
</body>
</html>', 'pesquisa', '["nome", "pesquisa_titulo", "link_pesquisa", "link_descadastro"]'),
('pesquisa-agradecimento', 'Agradecimento Pesquisa', 'Obrigado por participar! 🙏', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #10b981;">Obrigado! 🙏</h1>
  </div>
  
  <p>Olá, <strong>{{nome}}</strong>!</p>
  
  <p>Sua participação na pesquisa <strong>"{{pesquisa_titulo}}"</strong> foi registrada com sucesso.</p>
  
  <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981; margin: 20px 0;">
    <p style="margin: 0; color: #166534;">✅ Sua opinião é muito importante e será considerada em nossas decisões.</p>
  </div>
  
  <p>Juntos somos mais fortes!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #666; text-align: center;">
    Se você não deseja mais receber nossos emails, <a href="{{link_descadastro}}" style="color: #1a56db;">clique aqui para se descadastrar</a>.
  </p>
</body>
</html>', 'pesquisa', '["nome", "pesquisa_titulo", "link_descadastro"]');