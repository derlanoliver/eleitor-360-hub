-- Create sms_templates table
CREATE TABLE public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'geral',
  variaveis JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_templates
CREATE POLICY "sms_templates_modify" ON public.sms_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "sms_templates_select" ON public.sms_templates
  FOR SELECT USING (true);

-- Create sms_messages table
CREATE TABLE public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outgoing',
  status TEXT NOT NULL DEFAULT 'pending',
  contact_id UUID REFERENCES public.office_contacts(id) ON DELETE SET NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_messages
CREATE POLICY "sms_messages_insert_public" ON public.sms_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sms_messages_select_admin" ON public.sms_messages
  FOR SELECT USING (has_admin_access(auth.uid()));

CREATE POLICY "sms_messages_select_atendente" ON public.sms_messages
  FOR SELECT USING (has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "sms_messages_update_auth" ON public.sms_messages
  FOR UPDATE USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role))
  WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- Add SMSDEV columns to integrations_settings
ALTER TABLE public.integrations_settings
  ADD COLUMN smsdev_api_key TEXT,
  ADD COLUMN smsdev_enabled BOOLEAN DEFAULT false;

-- Insert initial SMS templates
INSERT INTO public.sms_templates (slug, nome, mensagem, categoria, variaveis) VALUES
  ('evento-convite-sms', 'Convite para Evento', 'Olá {{nome}}! Você está convidado para {{evento_nome}} dia {{evento_data}}. Inscreva-se: {{link_inscricao}}', 'eventos', '["nome", "evento_nome", "evento_data", "link_inscricao"]'),
  ('captacao-boas-vindas-sms', 'Boas-vindas Captação', 'Olá {{nome}}! Obrigado pelo interesse. Seu material: {{link_download}}', 'captacao', '["nome", "link_download"]'),
  ('verificacao-codigo-sms', 'Código de Verificação', 'Seu código de verificação é: {{codigo}}. Válido por 10 minutos.', 'verificacao', '["codigo"]'),
  ('lembrete-evento-sms', 'Lembrete de Evento', '{{nome}}, lembrete: {{evento_nome}} amanhã às {{evento_hora}}. Local: {{evento_local}}', 'eventos', '["nome", "evento_nome", "evento_hora", "evento_local"]'),
  ('pesquisa-convite-sms', 'Convite para Pesquisa', '{{nome}}, sua opinião importa! Participe: {{link_pesquisa}}', 'pesquisa', '["nome", "link_pesquisa"]');