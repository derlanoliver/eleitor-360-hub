-- Inserir template: Convite para Material de Captação
INSERT INTO email_templates (slug, nome, assunto, categoria, variaveis, conteudo_html, is_active)
VALUES (
  'captacao-convite-material',
  'Convite para Material de Captação',
  '📥 {{material_nome}} - Material exclusivo disponível para você!',
  'captacao',
  '["nome", "material_nome", "material_descricao", "link_captacao"]',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Material Exclusivo!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    <!-- Wrapper com background -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Container principal -->
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #FF9580; padding: 50px 40px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <!-- Logo -->
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="background-color: #E8766A; width: 60px; height: 60px; border-radius: 12px; font-size: 32px; line-height: 60px;">
                                                    📥
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Título -->
                                <tr>
                                    <td align="center" style="color: #ffffff; font-size: 32px; font-weight: 700; padding-bottom: 10px;">
                                        Material Exclusivo!
                                    </td>
                                </tr>
                                <!-- Subtítulo -->
                                <tr>
                                    <td align="center" style="color: rgba(255, 255, 255, 0.95); font-size: 16px;">
                                        Preparamos algo especial para você
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 50px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                
                                <!-- Greeting -->
                                <tr>
                                    <td style="font-size: 18px; color: #1f2937; line-height: 1.6; padding-bottom: 20px;">
                                        Olá, <strong style="color: #FF9580; font-weight: 600;">{{nome}}</strong>! 👋
                                    </td>
                                </tr>
                                
                                <!-- Message 1 -->
                                <tr>
                                    <td style="font-size: 16px; color: #4b5563; line-height: 1.8; padding-bottom: 30px;">
                                        Temos um material especial que pode fazer toda a diferença para você! Não perca essa oportunidade exclusiva.
                                    </td>
                                </tr>
                                
                                <!-- Material Info Box -->
                                <tr>
                                    <td style="padding: 30px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff5f3; border-left: 4px solid #FF9580; border-radius: 12px;">
                                            <tr>
                                                <td style="padding: 25px;">
                                                    <!-- Material Icon -->
                                                    <div style="font-size: 48px; margin-bottom: 15px; text-align: center;">📚</div>
                                                    
                                                    <!-- Material Name -->
                                                    <div style="text-align: center; margin-bottom: 20px;">
                                                        <span style="font-size: 22px; font-weight: 700; color: #1f2937;">{{material_nome}}</span>
                                                    </div>
                                                    
                                                    <!-- Material Description -->
                                                    <div style="text-align: center; color: #4b5563; font-size: 14px; line-height: 1.6;">
                                                        {{material_descricao}}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Benefits -->
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 16px; color: #1f2937; font-weight: 600; padding-bottom: 15px;">
                                                    O que você vai encontrar:
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 14px; color: #4b5563; line-height: 2;">
                                                    ✅ Conteúdo exclusivo e atualizado<br>
                                                    ✅ Material prático e direto ao ponto<br>
                                                    ✅ Download gratuito e imediato<br>
                                                    ✅ Acesso vitalício ao material
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- CTA Button -->
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="background-color: #FF9580; border-radius: 12px;">
                                                    <a href="{{link_captacao}}" style="display: inline-block; padding: 18px 50px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                                        Quero Baixar Agora →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Urgency -->
                                <tr>
                                    <td align="center" style="font-size: 13px; color: #9ca3af; padding-top: 15px;">
                                        ⚡ Clique no botão acima e garanta seu acesso agora mesmo!
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1f2937; padding: 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <!-- Logo/Name -->
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Rafael Prudente</span>
                                        <span style="color: #9ca3af; font-size: 14px;"> | 360.ai</span>
                                    </td>
                                </tr>
                                <!-- Social Links -->
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <a href="https://instagram.com/rafaelprudente" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Instagram</a>
                                        <span style="color: #4b5563;">|</span>
                                        <a href="https://facebook.com/rafaelprudente" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Facebook</a>
                                        <span style="color: #4b5563;">|</span>
                                        <a href="https://youtube.com/@rafaelprudente" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">YouTube</a>
                                    </td>
                                </tr>
                                <!-- Unsubscribe -->
                                <tr>
                                    <td align="center" style="color: #6b7280; font-size: 12px; line-height: 1.6;">
                                        Você está recebendo este email porque demonstrou interesse em nosso conteúdo.<br>
                                        <a href="#" style="color: #9ca3af; text-decoration: underline;">Cancelar inscrição</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
  true
);

-- Inserir template: Convite para Evento
INSERT INTO email_templates (slug, nome, assunto, categoria, variaveis, conteudo_html, is_active)
VALUES (
  'evento-convite-participar',
  'Convite para Evento',
  '📅 Você está convidado(a): {{evento_nome}}',
  'evento',
  '["nome", "evento_nome", "evento_data", "evento_hora", "evento_local", "evento_endereco", "evento_descricao", "link_inscricao"]',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Você está Convidado(a)!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    <!-- Wrapper com background -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Container principal -->
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #059669; padding: 50px 40px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <!-- Logo -->
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="background-color: #047857; width: 60px; height: 60px; border-radius: 12px; font-size: 32px; line-height: 60px;">
                                                    🎉
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Título -->
                                <tr>
                                    <td align="center" style="color: #ffffff; font-size: 32px; font-weight: 700; padding-bottom: 10px;">
                                        Você está Convidado(a)!
                                    </td>
                                </tr>
                                <!-- Subtítulo -->
                                <tr>
                                    <td align="center" style="color: rgba(255, 255, 255, 0.95); font-size: 16px;">
                                        Participe deste momento especial conosco
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 50px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                
                                <!-- Greeting -->
                                <tr>
                                    <td style="font-size: 18px; color: #1f2937; line-height: 1.6; padding-bottom: 20px;">
                                        Olá, <strong style="color: #059669; font-weight: 600;">{{nome}}</strong>! 👋
                                    </td>
                                </tr>
                                
                                <!-- Message 1 -->
                                <tr>
                                    <td style="font-size: 16px; color: #4b5563; line-height: 1.8; padding-bottom: 30px;">
                                        Você está oficialmente convidado(a) para participar de um evento muito especial! Garanta sua presença e não perca essa oportunidade única.
                                    </td>
                                </tr>
                                
                                <!-- Event Info Box -->
                                <tr>
                                    <td style="padding: 30px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 12px;">
                                            <tr>
                                                <td style="padding: 25px;">
                                                    <!-- Event Icon -->
                                                    <div style="font-size: 48px; margin-bottom: 15px; text-align: center;">📅</div>
                                                    
                                                    <!-- Event Name -->
                                                    <div style="text-align: center; margin-bottom: 20px;">
                                                        <span style="font-size: 22px; font-weight: 700; color: #1f2937;">{{evento_nome}}</span>
                                                    </div>
                                                    
                                                    <!-- Event Details -->
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                                                                <span style="color: #6b7280; font-size: 13px;">📆 Data:</span>
                                                                <span style="color: #1f2937; font-weight: 600; font-size: 14px; float: right;">{{evento_data}}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                                                                <span style="color: #6b7280; font-size: 13px;">🕐 Horário:</span>
                                                                <span style="color: #1f2937; font-weight: 600; font-size: 14px; float: right;">{{evento_hora}}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                                                                <span style="color: #6b7280; font-size: 13px;">📍 Local:</span>
                                                                <span style="color: #1f2937; font-weight: 600; font-size: 14px; float: right;">{{evento_local}}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0;">
                                                                <span style="color: #6b7280; font-size: 13px;">🗺️ Endereço:</span>
                                                                <div style="color: #1f2937; font-size: 14px; margin-top: 5px;">{{evento_endereco}}</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Event Description -->
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 16px; color: #1f2937; font-weight: 600; padding-bottom: 10px;">
                                                    Sobre o evento:
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 14px; color: #4b5563; line-height: 1.8;">
                                                    {{evento_descricao}}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- CTA Button -->
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="background-color: #059669; border-radius: 12px;">
                                                    <a href="{{link_inscricao}}" style="display: inline-block; padding: 18px 50px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                                        Garantir Minha Vaga →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Urgency -->
                                <tr>
                                    <td align="center" style="font-size: 13px; color: #9ca3af; padding-top: 15px;">
                                        ⚡ Vagas limitadas! Inscreva-se agora e garanta sua participação.
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1f2937; padding: 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <!-- Logo/Name -->
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Rafael Prudente</span>
                                        <span style="color: #9ca3af; font-size: 14px;"> | 360.ai</span>
                                    </td>
                                </tr>
                                <!-- Social Links -->
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <a href="https://instagram.com/rafaelprudente" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Instagram</a>
                                        <span style="color: #4b5563;">|</span>
                                        <a href="https://facebook.com/rafaelprudente" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">Facebook</a>
                                        <span style="color: #4b5563;">|</span>
                                        <a href="https://youtube.com/@rafaelprudente" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 14px;">YouTube</a>
                                    </td>
                                </tr>
                                <!-- Unsubscribe -->
                                <tr>
                                    <td align="center" style="color: #6b7280; font-size: 12px; line-height: 1.6;">
                                        Você está recebendo este email porque faz parte da nossa comunidade.<br>
                                        <a href="#" style="color: #9ca3af; text-decoration: underline;">Cancelar inscrição</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
  true
);