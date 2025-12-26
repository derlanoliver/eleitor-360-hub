-- Tabela para armazenar links de fotos dos eventos
CREATE TABLE public.event_photo_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  short_code TEXT UNIQUE,
  sms_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  sms_recipients_count INTEGER DEFAULT 0,
  email_recipients_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ
);

-- Tabela para URLs encurtadas
CREATE TABLE public.short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para event_photo_links
ALTER TABLE public.event_photo_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_photo_links_select" ON public.event_photo_links
  FOR SELECT USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "event_photo_links_insert" ON public.event_photo_links
  FOR INSERT WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "event_photo_links_update" ON public.event_photo_links
  FOR UPDATE USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- RLS para short_urls (público para leitura/redirecionamento)
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "short_urls_select_public" ON public.short_urls
  FOR SELECT USING (true);

CREATE POLICY "short_urls_insert" ON public.short_urls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "short_urls_update" ON public.short_urls
  FOR UPDATE USING (true);

-- Índices para performance
CREATE INDEX idx_event_photo_links_event_id ON public.event_photo_links(event_id);
CREATE INDEX idx_short_urls_code ON public.short_urls(code);

-- Template SMS para fotos de evento
INSERT INTO public.sms_templates (slug, nome, mensagem, categoria, variaveis)
VALUES (
  'evento-fotos-disponivel',
  'Fotos do Evento Disponíveis',
  'Olá! 👋
Obrigado por participar do {{nome_evento}}.
As fotos do evento já estão disponíveis:
{{link_fotos}}',
  'eventos',
  '["nome_evento", "link_fotos"]'::jsonb
);

-- Template Email para fotos de evento
INSERT INTO public.email_templates (slug, nome, assunto, conteudo_html, categoria, variaveis)
VALUES (
  'evento-fotos-disponivel',
  'Fotos do Evento Disponíveis',
  'Obrigado por participar do {{nome_evento}}! Confira as fotos 📸',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h1 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Obrigado por participar! 🎉</h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Olá,
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Foi um prazer ter você conosco no <strong>{{nome_evento}}</strong>.<br>
          Sua presença fez esse momento ainda mais especial.
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Preparamos um álbum com as fotos do evento para você relembrar os melhores momentos.
        </p>
        
        <a href="{{link_fotos}}" 
           style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
          📸 Ver fotos do evento
        </a>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
          Esperamos te ver novamente em nossos próximos eventos!
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; margin: 0;">
          {{nome_organizacao}}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'eventos',
  '["nome_evento", "link_fotos", "nome_organizacao"]'::jsonb
);