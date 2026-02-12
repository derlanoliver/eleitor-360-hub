
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.coordinator_set_password(p_leader_id uuid, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM lideres WHERE id = p_leader_id AND is_coordinator = true) THEN
    RETURN json_build_object('success', false, 'error', 'Líder não é coordenador');
  END IF;

  v_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));

  INSERT INTO coordinator_credentials (leader_id, password_hash)
  VALUES (p_leader_id, v_hash)
  ON CONFLICT (leader_id)
  DO UPDATE SET password_hash = v_hash, updated_at = now();

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.coordinator_login(p_phone text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_leader record;
  v_hash text;
BEGIN
  SELECT l.id, l.nome_completo, l.telefone, l.email, l.cadastros, l.pontuacao_total,
         l.cidade_id, l.affiliate_token, l.is_coordinator,
         cc.password_hash
  INTO v_leader
  FROM lideres l
  JOIN coordinator_credentials cc ON cc.leader_id = l.id
  WHERE l.telefone = p_phone AND l.is_coordinator = true AND l.is_active = true;

  IF v_leader IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Telefone ou senha inválidos');
  END IF;

  IF NOT extensions.crypt(p_password, v_leader.password_hash) = v_leader.password_hash THEN
    RETURN json_build_object('success', false, 'error', 'Telefone ou senha inválidos');
  END IF;

  RETURN json_build_object(
    'success', true,
    'coordinator', json_build_object(
      'id', v_leader.id,
      'nome_completo', v_leader.nome_completo,
      'telefone', v_leader.telefone,
      'email', v_leader.email,
      'cadastros', v_leader.cadastros,
      'pontuacao_total', v_leader.pontuacao_total,
      'cidade_id', v_leader.cidade_id,
      'affiliate_token', v_leader.affiliate_token
    )
  );
END;
$$;
