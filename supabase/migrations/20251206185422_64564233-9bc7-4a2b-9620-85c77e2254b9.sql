-- Inserir 3 novos templates de WhatsApp para líderes
INSERT INTO whatsapp_templates (slug, nome, mensagem, categoria, variaveis) VALUES
(
  'lideranca-pesquisa-link',
  'Link de Pesquisa para Líder',
  'Olá, {{nome}}! 👋

Precisamos da sua ajuda para ampliar o alcance da nossa pesquisa:

📊 *{{pesquisa_titulo}}*

Compartilhe o link abaixo com a sua base de contatos para que eles possam participar:

🔗 {{link_pesquisa_afiliado}}

Cada resposta através do seu link será contabilizada para você! 🏆

Contamos com você!',
  'lideranca',
  '["nome", "pesquisa_titulo", "link_pesquisa_afiliado"]'::jsonb
),
(
  'lideranca-reuniao-link',
  'Link de Reunião para Líder',
  'Olá, {{nome}}! 👋

Você tem contatos que gostariam de agendar uma reunião individual com {{deputado_nome}}?

Compartilhe o link abaixo para que eles possam se cadastrar e solicitar uma reunião:

🔗 {{link_reuniao_afiliado}}

Cada pessoa cadastrada através do seu link será contabilizada para você! 🏆

Contamos com você para fortalecer nossa rede!',
  'lideranca',
  '["nome", "deputado_nome", "link_reuniao_afiliado"]'::jsonb
),
(
  'lideranca-cadastro-link',
  'Link de Cadastro para Líder',
  'Olá, {{nome}}! 👋

Convide sua base de contatos para se cadastrar e receber novidades, materiais exclusivos e ficar por dentro de tudo!

Compartilhe o link abaixo:

🔗 {{link_cadastro_afiliado}}

Cada pessoa cadastrada através do seu link será contabilizada para você! 🏆

Contamos com você para ampliar nossa rede!',
  'lideranca',
  '["nome", "link_cadastro_afiliado"]'::jsonb
);

-- Inserir 3 novos templates de Email para líderes
INSERT INTO email_templates (slug, nome, assunto, conteudo_html, categoria, variaveis) VALUES
(
  'lideranca-pesquisa-link',
  'Convite para Líderes - Pesquisa',
  '📊 Seu link para compartilhar a pesquisa: {{pesquisa_titulo}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Olá, {{nome}}!</h2>
  
  <p>Precisamos da sua ajuda para ampliar o alcance da nossa pesquisa:</p>
  
  <h3 style="color: #2563eb;">📊 {{pesquisa_titulo}}</h3>
  
  <p>Compartilhe o link abaixo com a sua base de contatos para que eles possam participar:</p>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <a href="{{link_pesquisa_afiliado}}" style="color: #2563eb; word-break: break-all;">{{link_pesquisa_afiliado}}</a>
  </div>
  
  <div style="text-align: center; margin: 20px 0;">
    <img src="{{qr_code_url}}" alt="QR Code" width="150" style="border-radius: 8px;" />
  </div>
  
  <p><strong>Cada resposta através do seu link será contabilizada para você! 🏆</strong></p>
  
  <p>Contamos com você!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <p style="font-size: 12px; color: #666; text-align: center;">
    <a href="{{link_descadastro}}" style="color: #666;">Descadastrar-se</a>
  </p>
</body>
</html>',
  'lideranca',
  '["nome", "pesquisa_titulo", "link_pesquisa_afiliado", "qr_code_url", "link_descadastro"]'::jsonb
),
(
  'lideranca-reuniao-link',
  'Convite para Líder - Reunião Individual',
  '🤝 Seu link para agendamento de reuniões individuais',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Olá, {{nome}}!</h2>
  
  <p>Você tem contatos que gostariam de agendar uma reunião individual com <strong>{{deputado_nome}}</strong>?</p>
  
  <p>Compartilhe o link abaixo para que eles possam se cadastrar e solicitar uma reunião:</p>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <a href="{{link_reuniao_afiliado}}" style="color: #2563eb; word-break: break-all;">{{link_reuniao_afiliado}}</a>
  </div>
  
  <div style="text-align: center; margin: 20px 0;">
    <img src="{{qr_code_url}}" alt="QR Code" width="150" style="border-radius: 8px;" />
  </div>
  
  <p><strong>Cada pessoa cadastrada através do seu link será contabilizada para você! 🏆</strong></p>
  
  <p>Contamos com você para fortalecer nossa rede!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <p style="font-size: 12px; color: #666; text-align: center;">
    <a href="{{link_descadastro}}" style="color: #666;">Descadastrar-se</a>
  </p>
</body>
</html>',
  'lideranca',
  '["nome", "deputado_nome", "link_reuniao_afiliado", "qr_code_url", "link_descadastro"]'::jsonb
),
(
  'lideranca-cadastro-link',
  'Convite para Líder - Cadastro Individual',
  '📢 Seu link para cadastro de novos contatos',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Olá, {{nome}}!</h2>
  
  <p>Convide sua base de contatos para se cadastrar e receber novidades, materiais exclusivos e ficar por dentro de tudo!</p>
  
  <p>Compartilhe o link abaixo:</p>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <a href="{{link_cadastro_afiliado}}" style="color: #2563eb; word-break: break-all;">{{link_cadastro_afiliado}}</a>
  </div>
  
  <div style="text-align: center; margin: 20px 0;">
    <img src="{{qr_code_url}}" alt="QR Code" width="150" style="border-radius: 8px;" />
  </div>
  
  <p><strong>Cada pessoa cadastrada através do seu link será contabilizada para você! 🏆</strong></p>
  
  <p>Contamos com você para ampliar nossa rede!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <p style="font-size: 12px; color: #666; text-align: center;">
    <a href="{{link_descadastro}}" style="color: #666;">Descadastrar-se</a>
  </p>
</body>
</html>',
  'lideranca',
  '["nome", "link_cadastro_afiliado", "qr_code_url", "link_descadastro"]'::jsonb
);