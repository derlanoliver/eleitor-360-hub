-- Create whatsapp_templates table
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  categoria TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "whatsapp_templates_select" ON public.whatsapp_templates
  FOR SELECT USING (true);

CREATE POLICY "whatsapp_templates_modify" ON public.whatsapp_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial templates
INSERT INTO public.whatsapp_templates (slug, nome, mensagem, categoria, variaveis) VALUES
(
  'visita-link-formulario',
  'Link do Formulário de Visita',
  'Olá {{nome}}! 👋

Sua visita ao gabinete foi registrada com sucesso!

📋 *Protocolo:* {{protocolo}}

Para agilizar seu atendimento, por favor preencha o formulário abaixo:
{{form_link}}

Aguardamos você! 🏛️',
  'visita',
  '["nome", "protocolo", "form_link"]'::jsonb
),
(
  'visita-reuniao-cancelada',
  'Reunião Cancelada',
  'Olá {{nome}},

Informamos que sua reunião agendada foi *cancelada*.

📋 *Protocolo:* {{protocolo}}

Se desejar reagendar, entre em contato conosco.

Atenciosamente,
Gabinete {{deputado_nome}}',
  'visita',
  '["nome", "protocolo", "deputado_nome"]'::jsonb
),
(
  'visita-reuniao-reagendada',
  'Reunião Reagendada',
  'Olá {{nome}}! 📅

Sua reunião foi *reagendada* para uma nova data.

📋 *Protocolo:* {{protocolo}}
📅 *Nova data:* {{nova_data}}

Por favor, confirme sua presença respondendo esta mensagem.

Atenciosamente,
Gabinete {{deputado_nome}}',
  'visita',
  '["nome", "protocolo", "nova_data", "deputado_nome"]'::jsonb
),
(
  'evento-inscricao-confirmada',
  'Inscrição Confirmada em Evento',
  'Olá {{nome}}! 🎉

Sua inscrição foi *confirmada* com sucesso!

📌 *Evento:* {{evento_nome}}
📅 *Data:* {{evento_data}}
🕐 *Horário:* {{evento_hora}}
📍 *Local:* {{evento_local}}

Apresente o QR Code abaixo na entrada do evento.

Até lá! 👋',
  'evento',
  '["nome", "evento_nome", "evento_data", "evento_hora", "evento_local"]'::jsonb
),
(
  'evento-convite',
  'Convite para Evento',
  'Olá {{nome}}! 👋

Você está convidado(a) para um evento especial!

📌 *{{evento_nome}}*
📅 Data: {{evento_data}}
🕐 Horário: {{evento_hora}}
📍 Local: {{evento_local}}

{{evento_descricao}}

Garanta sua vaga: {{link_inscricao}}

Esperamos você! 🎉',
  'evento',
  '["nome", "evento_nome", "evento_data", "evento_hora", "evento_local", "evento_descricao", "link_inscricao"]'::jsonb
),
(
  'captacao-boas-vindas',
  'Boas-vindas Captação',
  'Olá {{nome}}! 👋

Obrigado pelo seu interesse!

📚 Seu material *{{material_nome}}* está disponível para download.

Acesse aqui: {{link_download}}

Qualquer dúvida, estamos à disposição! 😊',
  'captacao',
  '["nome", "material_nome", "link_download"]'::jsonb
),
(
  'captacao-convite',
  'Convite para Material de Captação',
  'Olá {{nome}}! 👋

Temos um material especial para você!

📚 *{{material_nome}}*
{{material_descricao}}

Baixe gratuitamente: {{link_captacao}}

Aproveite! 📖',
  'captacao',
  '["nome", "material_nome", "material_descricao", "link_captacao"]'::jsonb
),
(
  'lider-cadastro-confirmado',
  'Cadastro de Liderança Confirmado',
  'Olá {{nome}}! 🎉

Bem-vindo(a) à nossa rede de lideranças!

Seu cadastro foi realizado com sucesso. Agora você faz parte do nosso time!

🔗 Seu link de indicação: {{link_indicacao}}

Compartilhe com sua rede e ajude a fortalecer nosso movimento!

Juntos somos mais fortes! 💪',
  'lideranca',
  '["nome", "link_indicacao"]'::jsonb
);