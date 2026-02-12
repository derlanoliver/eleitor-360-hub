
CREATE OR REPLACE FUNCTION public.coordinator_set_password(p_leader_id uuid, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  -- Verify leader is a coordinator
  IF NOT EXISTS (SELECT 1 FROM lideres WHERE id = p_leader_id AND is_coordinator = true) THEN
    RETURN json_build_object('success', false, 'error', 'Líder não é coordenador');
  END IF;

  v_hash := crypt(p_password, gen_salt('bf'));

  INSERT INTO coordinator_credentials (leader_id, password_hash)
  VALUES (p_leader_id, v_hash)
  ON CONFLICT (leader_id)
  DO UPDATE SET password_hash = v_hash, updated_at = now();

  RETURN json_build_object('success', true);
END;
$$;
