UPDATE whatsapp_templates 
SET 
  mensagem = 'Olá {{nome}}! 👋

Você foi convidado(a) para fazer parte da rede de apoiadores do {{deputado_nome}}.

Para confirmar seu cadastro, por favor responda a próxima mensagem com o código que você receberá.

Este código é único e pessoal. Ao responder, você confirma seu interesse em receber nossas comunicações.

⚠️ Não compartilhe este código com ninguém.',
  variaveis = '["nome", "deputado_nome", "codigo"]'::jsonb,
  updated_at = now()
WHERE slug = 'verificacao-cadastro';