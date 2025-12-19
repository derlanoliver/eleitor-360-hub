-- Adicionar campos para rastrear método de verificação
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS verification_method text;
ALTER TABLE lideres ADD COLUMN IF NOT EXISTS verified_by_user_id uuid;

-- Comentários para documentação
COMMENT ON COLUMN lideres.verification_method IS 'Método de verificação: link (automático) ou manual';
COMMENT ON COLUMN lideres.verified_by_user_id IS 'ID do usuário que fez a verificação manual (NULL se foi via link)';

-- Atualizar função verify_leader_by_code para registrar método 'link'
CREATE OR REPLACE FUNCTION verify_leader_by_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Marcar como verificado VIA LINK
  UPDATE lideres
  SET 
    is_verified = true,
    verified_at = now(),
    verification_method = 'link',
    verified_by_user_id = NULL,
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

-- Atualizar função mark_leader_verified_manually para registrar método 'manual' e quem verificou
CREATE OR REPLACE FUNCTION mark_leader_verified_manually(_leader_id uuid, _verified_by uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE lideres
  SET 
    is_verified = true,
    verified_at = now(),
    verification_method = 'manual',
    verified_by_user_id = _verified_by,
    updated_at = now()
  WHERE id = _leader_id;
  
  RETURN FOUND;
END;
$$;