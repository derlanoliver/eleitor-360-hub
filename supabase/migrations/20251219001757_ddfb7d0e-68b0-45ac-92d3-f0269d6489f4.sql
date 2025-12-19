-- Adicionar campos de verificação em lideres
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS verification_code text;
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz;
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Índice único para código de verificação
CREATE UNIQUE INDEX IF NOT EXISTS idx_lideres_verification_code 
ON lideres(verification_code) WHERE verification_code IS NOT NULL;

-- Função para gerar código de verificação para líderes
CREATE OR REPLACE FUNCTION public.generate_leader_verification_code()
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
    FOR i IN 1..6 LOOP
      _code := _code || substr(_chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM lideres WHERE verification_code = _code) INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;
  RETURN _code;
END;
$$;

-- Função para verificar líder por código
CREATE OR REPLACE FUNCTION public.verify_leader_by_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader RECORD;
BEGIN
  SELECT l.*, c.nome as cidade_nome
  INTO v_leader
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  WHERE l.verification_code = _code;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Código de verificação inválido.'
    );
  END IF;
  
  IF v_leader.is_verified = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_verified', true,
      'nome', v_leader.nome_completo,
      'leader_id', v_leader.id,
      'affiliate_token', v_leader.affiliate_token
    );
  END IF;
  
  -- Marcar como verificado
  UPDATE lideres
  SET 
    is_verified = true,
    verified_at = now(),
    updated_at = now()
  WHERE id = v_leader.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'already_verified', false,
    'nome', v_leader.nome_completo,
    'leader_id', v_leader.id,
    'affiliate_token', v_leader.affiliate_token
  );
END;
$$;

-- RPC para atualizar verification_sent_at do líder
CREATE OR REPLACE FUNCTION public.update_leader_verification_sent(_leader_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lideres
  SET verification_sent_at = now()
  WHERE id = _leader_id;
  
  RETURN FOUND;
END;
$$;

-- RPC para marcar líder como verificado manualmente
CREATE OR REPLACE FUNCTION public.mark_leader_verified_manually(_leader_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lideres
  SET 
    is_verified = true,
    verified_at = now(),
    updated_at = now()
  WHERE id = _leader_id;
  
  RETURN FOUND;
END;
$$;

-- Inserir template de SMS para verificação de líder
INSERT INTO sms_templates (slug, nome, mensagem, categoria, variaveis)
VALUES (
  'verificacao-lider-sms',
  'Verificação de Líder',
  'Ola {{nome}}! Confirme seu cadastro como lideranca clicando no link: {{link_verificacao}}',
  'liderancas',
  '["nome", "link_verificacao"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  mensagem = EXCLUDED.mensagem,
  variaveis = EXCLUDED.variaveis;