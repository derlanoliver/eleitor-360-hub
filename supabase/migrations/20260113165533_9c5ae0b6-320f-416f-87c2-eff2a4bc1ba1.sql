-- Update SMS templates: change "Líder/Liderança" to "Apoiador"

-- 1. verificacao-lider-sms
UPDATE sms_templates
SET 
  nome = 'Verificação de Apoiador',
  mensagem = '{{nome}}, confirme seu cadastro como apoiador! Acesse: {{link_verificacao}}',
  categoria = 'apoiadores',
  updated_at = now()
WHERE slug = 'verificacao-lider-sms';

-- 2. lider-cadastro-confirmado-sms  
UPDATE sms_templates
SET 
  nome = 'Cadastro de Apoiador Confirmado',
  categoria = 'apoiadores',
  updated_at = now()
WHERE slug = 'lider-cadastro-confirmado-sms';

-- Update Email templates: change "Líder/Liderança" to "Apoiador"

-- 1. lideranca-boas-vindas
UPDATE email_templates
SET 
  nome = 'Boas-vindas para Novo Apoiador',
  assunto = '🎉 Bem-vindo(a) à nossa rede de apoiadores!',
  categoria = 'apoiadores',
  conteudo_html = REPLACE(REPLACE(REPLACE(REPLACE(conteudo_html, 
    'liderança', 'apoiador'),
    'Liderança', 'Apoiador'),
    'lideranças', 'apoiadores'),
    'Lideranças', 'Apoiadores'),
  updated_at = now()
WHERE slug = 'lideranca-boas-vindas';

-- 2. lideranca-cadastro-link
UPDATE email_templates
SET 
  nome = 'Convite para Apoiador - Cadastro Individual',
  categoria = 'apoiadores',
  conteudo_html = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(conteudo_html, 
    'líder', 'apoiador'),
    'Líder', 'Apoiador'),
    'liderança', 'apoiador'),
    'Liderança', 'Apoiador'),
    'líderes', 'apoiadores'),
    'Líderes', 'Apoiadores'),
  updated_at = now()
WHERE slug = 'lideranca-cadastro-link';

-- 3. lideranca-reuniao-link
UPDATE email_templates
SET 
  nome = 'Convite para Apoiador - Reunião Individual',
  categoria = 'apoiadores',
  conteudo_html = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(conteudo_html, 
    'líder', 'apoiador'),
    'Líder', 'Apoiador'),
    'liderança', 'apoiador'),
    'Liderança', 'Apoiador'),
    'líderes', 'apoiadores'),
    'Líderes', 'Apoiadores'),
  updated_at = now()
WHERE slug = 'lideranca-reuniao-link';

-- 4. lideranca-evento-convite
UPDATE email_templates
SET 
  nome = 'Convite para Apoiadores - Evento',
  categoria = 'apoiadores',
  conteudo_html = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(conteudo_html, 
    'líder', 'apoiador'),
    'Líder', 'Apoiador'),
    'liderança', 'apoiador'),
    'Liderança', 'Apoiador'),
    'líderes', 'apoiadores'),
    'Líderes', 'Apoiadores'),
  updated_at = now()
WHERE slug = 'lideranca-evento-convite';

-- 5. lideranca-pesquisa-link
UPDATE email_templates
SET 
  nome = 'Convite para Apoiadores - Pesquisa',
  categoria = 'apoiadores',
  conteudo_html = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(conteudo_html, 
    'líder', 'apoiador'),
    'Líder', 'Apoiador'),
    'liderança', 'apoiador'),
    'Liderança', 'Apoiador'),
    'líderes', 'apoiadores'),
    'Líderes', 'Apoiadores'),
  updated_at = now()
WHERE slug = 'lideranca-pesquisa-link';

-- 6. lider-cadastro-boas-vindas
UPDATE email_templates
SET 
  nome = 'Cadastro via Apoiador',
  categoria = 'apoiadores',
  conteudo_html = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(conteudo_html, 
    'líder', 'apoiador'),
    'Líder', 'Apoiador'),
    'liderança', 'apoiador'),
    'Liderança', 'Apoiador'),
    'líderes', 'apoiadores'),
    'Líderes', 'Apoiadores'),
  updated_at = now()
WHERE slug = 'lider-cadastro-boas-vindas';