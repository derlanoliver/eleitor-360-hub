-- 1. Adicionar campos de verificação em office_contacts
ALTER TABLE office_contacts ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE office_contacts ADD COLUMN IF NOT EXISTS verification_code text;
ALTER TABLE office_contacts ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz;
ALTER TABLE office_contacts ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE office_contacts ADD COLUMN IF NOT EXISTS pending_messages jsonb DEFAULT '[]'::jsonb;

-- 2. Criar índice único para código de verificação
CREATE UNIQUE INDEX IF NOT EXISTS idx_office_contacts_verification_code 
ON office_contacts(verification_code) WHERE verification_code IS NOT NULL;

-- 3. Função para gerar código de verificação único (5 caracteres alfanuméricos)
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
  _exists BOOLEAN;
  _chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
BEGIN
  LOOP
    _code := '';
    FOR i IN 1..5 LOOP
      _code := _code || substr(_chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM office_contacts WHERE verification_code = _code) INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;
  RETURN _code;
END;
$$;

-- 4. Trigger para gerar código automaticamente em cadastros via líder
CREATE OR REPLACE FUNCTION set_contact_verification_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só gera código para cadastros via líder (não captação)
  IF NEW.source_type = 'lider' AND NEW.source_id IS NOT NULL AND NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_contact_verification_code_trigger ON office_contacts;
CREATE TRIGGER set_contact_verification_code_trigger
BEFORE INSERT ON office_contacts
FOR EACH ROW
EXECUTE FUNCTION set_contact_verification_code();

-- 5. Modificar trigger de pontuação de indicação para só computar após verificação
CREATE OR REPLACE FUNCTION score_contact_indication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _registrant_leader_id UUID;
BEGIN
  -- IMPORTANTE: Só pontua se o contato estiver verificado (ou não for via líder)
  IF NEW.source_type = 'lider' AND NEW.source_id IS NOT NULL AND NEW.is_verified = false THEN
    -- Não pontua ainda - será pontuado quando verificar
    RETURN NEW;
  END IF;

  -- Se foi indicado por um líder E está verificado: +1 ponto e +1 cadastro para o líder
  IF NEW.source_type = 'lider' AND NEW.source_id IS NOT NULL AND NEW.is_verified = true THEN
    PERFORM award_leader_points(NEW.source_id::UUID, 1, 'indicacao_contato');
    PERFORM increment_leader_cadastros(NEW.source_id::UUID);
  END IF;
  
  -- Verificar se o contato que se cadastrou é um líder: +1 ponto para ele
  SELECT id INTO _registrant_leader_id
  FROM lideres
  WHERE is_active = true
    AND (
      (telefone IS NOT NULL AND normalize_phone_e164(telefone) = NEW.telefone_norm)
      OR (email IS NOT NULL AND email = NEW.email)
    )
  LIMIT 1;
  
  IF _registrant_leader_id IS NOT NULL AND (NEW.source_type != 'lider' OR NEW.source_id::UUID != _registrant_leader_id) THEN
    PERFORM award_leader_points(_registrant_leader_id, 1, 'lider_cadastro_proprio');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Função para processar pontuação pendente após verificação
CREATE OR REPLACE FUNCTION process_verification_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _registrant_leader_id UUID;
BEGIN
  -- Só executa quando is_verified muda de false para true
  IF NEW.is_verified = true AND (OLD.is_verified IS NULL OR OLD.is_verified = false) THEN
    -- Se foi indicado por um líder: +1 ponto e +1 cadastro para o líder
    IF NEW.source_type = 'lider' AND NEW.source_id IS NOT NULL THEN
      PERFORM award_leader_points(NEW.source_id::UUID, 1, 'indicacao_contato_verificado');
      PERFORM increment_leader_cadastros(NEW.source_id::UUID);
    END IF;
    
    -- Verificar se o contato que se cadastrou é um líder: +1 ponto para ele
    SELECT id INTO _registrant_leader_id
    FROM lideres
    WHERE is_active = true
      AND (
        (telefone IS NOT NULL AND normalize_phone_e164(telefone) = NEW.telefone_norm)
        OR (email IS NOT NULL AND email = NEW.email)
      )
    LIMIT 1;
    
    IF _registrant_leader_id IS NOT NULL AND (NEW.source_type != 'lider' OR NEW.source_id IS NULL OR NEW.source_id::UUID != _registrant_leader_id) THEN
      PERFORM award_leader_points(_registrant_leader_id, 1, 'lider_cadastro_proprio_verificado');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS process_verification_gamification_trigger ON office_contacts;
CREATE TRIGGER process_verification_gamification_trigger
AFTER UPDATE ON office_contacts
FOR EACH ROW
EXECUTE FUNCTION process_verification_gamification();

-- 7. Modificar trigger de evento para verificar status antes de pontuar
CREATE OR REPLACE FUNCTION score_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _registrant_leader_id UUID;
  _contact_verified BOOLEAN;
BEGIN
  -- Se foi indicado por um líder via link de afiliado, verificar se contato está verificado
  IF NEW.leader_id IS NOT NULL THEN
    -- Buscar status de verificação do contato
    SELECT is_verified INTO _contact_verified
    FROM office_contacts
    WHERE id = NEW.contact_id;
    
    -- Só pontua se verificado ou se não tiver contact_id (contato novo)
    IF _contact_verified = true OR NEW.contact_id IS NULL THEN
      PERFORM award_leader_points(NEW.leader_id, 1, 'indicacao_evento');
      PERFORM increment_leader_cadastros(NEW.leader_id);
    END IF;
  END IF;
  
  -- Verificar se o inscrito é um líder: +1 ponto para ele mesmo
  SELECT id INTO _registrant_leader_id
  FROM lideres
  WHERE is_active = true
    AND (
      (telefone IS NOT NULL AND normalize_phone_e164(telefone) = normalize_phone_e164(NEW.whatsapp))
      OR (email IS NOT NULL AND email = NEW.email)
    )
  LIMIT 1;
  
  -- Líder ganha +1 ponto por se inscrever (mesmo que via link de outro líder)
  IF _registrant_leader_id IS NOT NULL THEN
    PERFORM award_leader_points(_registrant_leader_id, 1, 'lider_inscricao_evento');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Inserir templates de WhatsApp para verificação
INSERT INTO whatsapp_templates (slug, nome, mensagem, categoria, variaveis, is_active)
VALUES 
  ('verificacao-cadastro', 'Verificação de Cadastro', 
   'Olá {{nome}}! 👋

Você foi indicado(a) por *{{lider_nome}}* para fazer parte da rede de apoiadores do {{deputado_nome}}.

Para confirmar seu cadastro, por favor responda esta mensagem com o código abaixo:

🔐 *Código:* {{codigo}}

Este código é único e pessoal. Ao responder, você confirma seu interesse em receber nossas comunicações.

⚠️ Não compartilhe este código.',
   'verificacao',
   '["nome", "lider_nome", "deputado_nome", "codigo"]'::jsonb,
   true),
  ('verificacao-confirmada', 'Verificação Confirmada',
   '✅ *Cadastro Confirmado!*

Olá {{nome}}, seu cadastro foi verificado com sucesso!

Agora você receberá nossas comunicações e novidades do {{deputado_nome}}.

Obrigado por fazer parte! 🎉',
   'verificacao',
   '["nome", "deputado_nome"]'::jsonb,
   true)
ON CONFLICT (slug) DO UPDATE SET
  mensagem = EXCLUDED.mensagem,
  variaveis = EXCLUDED.variaveis;