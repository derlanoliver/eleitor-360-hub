-- Add Resend fields to integrations_settings
ALTER TABLE integrations_settings
ADD COLUMN IF NOT EXISTS resend_api_key text,
ADD COLUMN IF NOT EXISTS resend_from_email text,
ADD COLUMN IF NOT EXISTS resend_from_name text,
ADD COLUMN IF NOT EXISTS resend_enabled boolean DEFAULT false;

-- Create email_templates table
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  assunto text NOT NULL,
  conteudo_html text NOT NULL,
  categoria text NOT NULL,
  variaveis jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_templates
CREATE POLICY "email_templates_select" ON public.email_templates
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "email_templates_modify" ON public.email_templates
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create email_logs table
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.email_templates(id),
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resend_id text,
  error_message text,
  contact_id uuid REFERENCES public.office_contacts(id),
  leader_id uuid REFERENCES public.lideres(id),
  event_id uuid REFERENCES public.events(id),
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_logs
CREATE POLICY "email_logs_select" ON public.email_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "email_logs_insert" ON public.email_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "email_logs_update" ON public.email_logs
FOR UPDATE USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (slug, nome, assunto, categoria, variaveis, conteudo_html) VALUES
('boas-vindas-plataforma', 'Boas-vindas na Plataforma', 'Bem-vindo(a) à nossa plataforma!', 'sistema', '["nome", "email"]',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#1a365d;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f8fafc;padding:30px;border-radius:0 0 8px 8px}.btn{display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:20px}</style></head>
<body><div class="header"><h1>Bem-vindo(a)!</h1></div><div class="content"><p>Olá <strong>{{nome}}</strong>,</p><p>É um prazer ter você conosco! Seu cadastro foi realizado com sucesso.</p><p>Agora você tem acesso a todas as funcionalidades da nossa plataforma.</p><p>Qualquer dúvida, estamos à disposição.</p></div><div class="footer"><p>Este é um email automático, por favor não responda.</p></div></body></html>'),

('visita-reuniao-cancelada', 'Reunião Cancelada', 'Sua reunião foi cancelada', 'visita', '["nome", "protocolo", "motivo"]',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#dc2626;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f8fafc;padding:30px;border-radius:0 0 8px 8px}.info-box{background:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin:20px 0}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:20px}</style></head>
<body><div class="header"><h1>Reunião Cancelada</h1></div><div class="content"><p>Olá <strong>{{nome}}</strong>,</p><p>Informamos que sua reunião foi cancelada.</p><div class="info-box"><p><strong>Protocolo:</strong> {{protocolo}}</p><p><strong>Motivo:</strong> {{motivo}}</p></div><p>Caso deseje reagendar, entre em contato conosco.</p></div><div class="footer"><p>Este é um email automático, por favor não responda.</p></div></body></html>'),

('visita-reuniao-reagendada', 'Reunião Reagendada', 'Sua reunião foi reagendada', 'visita', '["nome", "protocolo", "nova_data"]',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#f59e0b;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f8fafc;padding:30px;border-radius:0 0 8px 8px}.info-box{background:#fffbeb;border-left:4px solid #f59e0b;padding:15px;margin:20px 0}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:20px}</style></head>
<body><div class="header"><h1>Reunião Reagendada</h1></div><div class="content"><p>Olá <strong>{{nome}}</strong>,</p><p>Sua reunião foi reagendada para uma nova data.</p><div class="info-box"><p><strong>Protocolo:</strong> {{protocolo}}</p><p><strong>Nova Data:</strong> {{nova_data}}</p></div><p>Aguardamos você!</p></div><div class="footer"><p>Este é um email automático, por favor não responda.</p></div></body></html>'),

('evento-cadastro-confirmado', 'Cadastro no Evento Confirmado', 'Inscrição confirmada: {{evento_nome}}', 'evento', '["nome", "evento_nome", "evento_data", "evento_hora", "evento_local", "evento_endereco", "qr_code_url"]',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#059669;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f8fafc;padding:30px;border-radius:0 0 8px 8px}.info-box{background:#ecfdf5;border-left:4px solid #059669;padding:15px;margin:20px 0}.qr-code{text-align:center;margin:20px 0}.qr-code img{max-width:200px;border:2px solid #e5e7eb;border-radius:8px;padding:10px;background:white}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:20px}</style></head>
<body><div class="header"><h1>Inscrição Confirmada!</h1></div><div class="content"><p>Olá <strong>{{nome}}</strong>,</p><p>Sua inscrição no evento foi confirmada com sucesso!</p><div class="info-box"><p><strong>Evento:</strong> {{evento_nome}}</p><p><strong>Data:</strong> {{evento_data}}</p><p><strong>Horário:</strong> {{evento_hora}}</p><p><strong>Local:</strong> {{evento_local}}</p><p><strong>Endereço:</strong> {{evento_endereco}}</p></div><div class="qr-code"><p><strong>Seu QR Code para Check-in:</strong></p><img src="{{qr_code_url}}" alt="QR Code" /></div><p>Apresente este QR Code no dia do evento para fazer seu check-in.</p></div><div class="footer"><p>Este é um email automático, por favor não responda.</p></div></body></html>'),

('captacao-boas-vindas', 'Boas-vindas - Material de Captação', 'Seu material está pronto!', 'captacao', '["nome", "material_nome", "download_url"]',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#7c3aed;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f8fafc;padding:30px;border-radius:0 0 8px 8px}.btn{display:inline-block;background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}.cta{text-align:center;margin:30px 0}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:20px}</style></head>
<body><div class="header"><h1>Seu Material Chegou!</h1></div><div class="content"><p>Olá <strong>{{nome}}</strong>,</p><p>Obrigado pelo seu interesse! Seu material <strong>{{material_nome}}</strong> está pronto para download.</p><div class="cta"><a href="{{download_url}}" class="btn">📥 Baixar Material</a></div><p>Esperamos que este conteúdo seja muito útil para você!</p></div><div class="footer"><p>Este é um email automático, por favor não responda.</p></div></body></html>'),

('lider-cadastro-boas-vindas', 'Cadastro via Líder', 'Bem-vindo(a)! Cadastro realizado com sucesso', 'lider', '["nome", "lider_nome"]',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#0891b2;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f8fafc;padding:30px;border-radius:0 0 8px 8px}.info-box{background:#ecfeff;border-left:4px solid #0891b2;padding:15px;margin:20px 0}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:20px}</style></head>
<body><div class="header"><h1>Cadastro Realizado!</h1></div><div class="content"><p>Olá <strong>{{nome}}</strong>,</p><p>Seu cadastro foi realizado com sucesso através do nosso líder <strong>{{lider_nome}}</strong>.</p><div class="info-box"><p>Agora você faz parte da nossa comunidade e receberá informações sobre eventos, reuniões e muito mais!</p></div><p>Seja bem-vindo(a)!</p></div><div class="footer"><p>Este é um email automático, por favor não responda.</p></div></body></html>'),

('lideranca-evento-convite', 'Convite para Líderes - Evento', '🎯 Novo evento: {{evento_nome}} - Divulgue para sua base!', 'lideranca', '["nome", "evento_nome", "evento_data", "evento_hora", "evento_local", "link_afiliado", "qr_code_url"]',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#1e40af;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f8fafc;padding:30px;border-radius:0 0 8px 8px}.info-box{background:#eff6ff;border-left:4px solid #1e40af;padding:15px;margin:20px 0}.btn{display:inline-block;background:#1e40af;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:10px 5px;font-weight:bold}.cta{text-align:center;margin:30px 0}.qr-code{text-align:center;margin:20px 0;background:#fff;padding:20px;border-radius:8px;border:1px solid #e5e7eb}.qr-code img{max-width:180px}.link-box{background:#f1f5f9;padding:15px;border-radius:6px;margin:15px 0;word-break:break-all;font-family:monospace;font-size:12px}.footer{text-align:center;color:#64748b;font-size:12px;margin-top:20px}</style></head>
<body><div class="header"><h1>🎯 Novo Evento!</h1><p>Divulgue para sua base</p></div><div class="content"><p>Olá <strong>{{nome}}</strong>,</p><p>Temos um novo evento e gostaríamos que você divulgasse para sua base de contatos!</p><div class="info-box"><p><strong>Evento:</strong> {{evento_nome}}</p><p><strong>Data:</strong> {{evento_data}}</p><p><strong>Horário:</strong> {{evento_hora}}</p><p><strong>Local:</strong> {{evento_local}}</p></div><h3>Seu Link Personalizado:</h3><div class="link-box">{{link_afiliado}}</div><div class="qr-code"><p><strong>Seu QR Code:</strong></p><img src="{{qr_code_url}}" alt="QR Code" /><p style="font-size:12px;color:#64748b">Use este QR Code em materiais impressos</p></div><div class="cta"><a href="{{link_afiliado}}" class="btn">🔗 Acessar Meu Link</a></div><p>Cada cadastro feito através do seu link será contabilizado para você!</p></div><div class="footer"><p>Este é um email automático, por favor não responda.</p></div></body></html>');

-- Enable realtime for email_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;