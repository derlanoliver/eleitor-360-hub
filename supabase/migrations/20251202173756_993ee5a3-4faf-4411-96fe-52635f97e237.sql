-- Add email template for office visit registration with form link
INSERT INTO public.email_templates (slug, nome, assunto, conteudo_html, categoria, variaveis, is_active) VALUES
(
  'visita-cadastro-link-formulario',
  'Visita Cadastrada - Link do Formulário',
  'Complete seu cadastro - Gabinete {{deputado_nome}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete seu Cadastro</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Gabinete {{deputado_nome}}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Sistema de Atendimento</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Olá, {{nome}}!</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Sua visita ao gabinete foi registrada com sucesso. Para dar continuidade ao atendimento, precisamos que você complete seu cadastro através do link abaixo.
              </p>

              <!-- Protocol Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">Número do Protocolo</p>
                    <p style="color: #1e293b; font-size: 20px; font-weight: 700; margin: 0; font-family: monospace;">{{protocolo}}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 10px 0 30px 0;">
                    <a href="{{form_link}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Completar Cadastro
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 25px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>⚠️ Importante:</strong> O preenchimento do formulário é necessário para confirmar sua presença no gabinete.
                </p>
              </div>

              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                Se você não solicitou esta visita ou tem alguma dúvida, por favor entre em contato conosco.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center; line-height: 1.5;">
                Este é um email automático do sistema de atendimento.<br>
                Gabinete {{deputado_nome}}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'visita',
  '["nome", "protocolo", "form_link", "deputado_nome"]',
  true
);