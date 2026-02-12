
CREATE OR REPLACE FUNCTION public.coordinator_login(p_phone text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader record;
  v_clean_phone text;
BEGIN
  -- Normalize: remove everything except digits
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

  SELECT l.id, l.nome_completo, l.telefone, l.email, l.cadastros, l.pontuacao_total,
         l.cidade_id, l.affiliate_token, l.is_coordinator,
         cc.password_hash
  INTO v_leader
  FROM lideres l
  JOIN coordinator_credentials cc ON cc.leader_id = l.id
  WHERE regexp_replace(l.telefone, '[^0-9]', '', 'g') = v_clean_phone
    AND l.is_coordinator = true AND l.is_active = true;

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
