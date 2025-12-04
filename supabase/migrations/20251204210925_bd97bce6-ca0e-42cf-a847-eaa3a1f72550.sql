-- Template de Email para cadastro de membro
INSERT INTO email_templates (slug, nome, assunto, conteudo_html, categoria, variaveis, is_active)
VALUES (
  'membro-cadastro-boas-vindas',
  'Boas-vindas ao Novo Membro',
  'Bem-vindo(a) à equipe! Suas credenciais de acesso',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Bem-vindo(a) à Equipe!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Olá, <strong>{{nome}}</strong>!</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Você foi cadastrado(a) como <strong style="color: #1e40af;">{{nivel}}</strong> na plataforma.</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="font-size: 16px; color: #1e40af; margin: 0 0 15px 0;">📋 Suas credenciais de acesso:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Email:</td>
          <td style="padding: 8px 0; font-weight: 600;">{{email}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Senha temporária:</td>
          <td style="padding: 8px 0; font-weight: 600; font-family: monospace; background: #fef3c7; padding: 4px 8px; border-radius: 4px;">{{senha}}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link_plataforma}}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Acessar Plataforma</a>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin-top: 25px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso em <strong>Configurações → Privacidade</strong>.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">Este é um email automático. Por favor, não responda.</p>
  </div>
</body>
</html>',
  'equipe',
  '["nome", "email", "senha", "nivel", "link_plataforma"]'::jsonb,
  true
);

-- Template de WhatsApp para cadastro de membro
INSERT INTO whatsapp_templates (slug, nome, mensagem, categoria, variaveis, is_active)
VALUES (
  'membro-cadastro-boas-vindas',
  'Boas-vindas ao Novo Membro',
  '🎉 *Bem-vindo(a) à equipe, {{nome}}!*

Você foi cadastrado(a) como *{{nivel}}* na plataforma.

📋 *Suas credenciais de acesso:*
• Email: {{email}}
• Senha: {{senha}}

🔗 Acesse a plataforma:
{{link_plataforma}}

⚠️ *Importante:* Altere sua senha após o primeiro acesso em Configurações → Privacidade.',
  'equipe',
  '["nome", "email", "senha", "nivel", "link_plataforma"]'::jsonb,
  true
);