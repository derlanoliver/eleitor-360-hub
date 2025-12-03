-- Insert WhatsApp template for leader event affiliate link
INSERT INTO whatsapp_templates (slug, nome, mensagem, categoria, variaveis, is_active)
VALUES (
  'lideranca-evento-link',
  'Link de Evento para Líder',
  'Olá {{nome}}! 👋

Temos um evento especial e contamos com você para divulgar!

📌 *{{evento_nome}}*
📅 Data: {{evento_data}}
🕐 Horário: {{evento_hora}}
📍 Local: {{evento_local}}

🔗 *Seu link exclusivo de divulgação:*
{{link_afiliado}}

Compartilhe com sua rede! Cada inscrição através do seu link será contabilizada no seu histórico.

Juntos somos mais fortes! 💪',
  'lideranca',
  '["nome", "evento_nome", "evento_data", "evento_hora", "evento_local", "link_afiliado"]',
  true
);

-- Insert Email template for new leader welcome
INSERT INTO email_templates (slug, nome, assunto, conteudo_html, categoria, variaveis, is_active)
VALUES (
  'lideranca-boas-vindas',
  'Boas-vindas para Nova Liderança',
  '🎉 Bem-vindo(a) à nossa rede de lideranças!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à nossa rede</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Bem-vindo(a)!</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Você agora faz parte da nossa rede de lideranças</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>{{nome}}</strong>,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                É com grande satisfação que recebemos você em nossa rede de lideranças! A partir de agora, você tem acesso a um link exclusivo para indicar novos apoiadores.
              </p>
              
              <!-- Link Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="background-color: #ecfdf5; border-radius: 8px; padding: 25px; border-left: 4px solid #059669;">
                    <p style="color: #065f46; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">🔗 Seu link exclusivo de indicação:</p>
                    <p style="color: #059669; font-size: 14px; margin: 0; word-break: break-all;">
                      <a href="{{link_indicacao}}" style="color: #059669; text-decoration: underline;">{{link_indicacao}}</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>Como funciona:</strong>
              </p>
              <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li>Compartilhe seu link com amigos, familiares e conhecidos</li>
                <li>Cada pessoa que se cadastrar através do seu link ficará vinculada a você</li>
                <li>Acompanhe suas indicações no sistema</li>
              </ul>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{link_indicacao}}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Acessar meu link
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Contamos com você para fortalecer nossa rede!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Este é um email automático. Em caso de dúvidas, entre em contato conosco.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'lideranca',
  '["nome", "link_indicacao"]',
  true
);