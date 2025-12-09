-- Function to verify contact by code (SECURITY DEFINER for public access)
CREATE OR REPLACE FUNCTION public.verify_contact_by_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact RECORD;
  v_leader RECORD;
BEGIN
  -- Find contact by verification code
  SELECT c.*, ci.nome as cidade_nome
  INTO v_contact
  FROM office_contacts c
  LEFT JOIN office_cities ci ON ci.id = c.cidade_id
  WHERE c.verification_code = _code;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Código de verificação inválido.'
    );
  END IF;
  
  -- Check if already verified
  IF v_contact.is_verified = true THEN
    -- Get leader info for already verified
    SELECT nome_completo INTO v_leader
    FROM lideres
    WHERE id = v_contact.source_id::uuid;
    
    RETURN jsonb_build_object(
      'success', true,
      'already_verified', true,
      'nome', v_contact.nome,
      'lider_nome', COALESCE(v_leader.nome_completo, 'Líder')
    );
  END IF;
  
  -- Get leader info
  IF v_contact.source_type = 'lider' AND v_contact.source_id IS NOT NULL THEN
    SELECT nome_completo INTO v_leader
    FROM lideres
    WHERE id = v_contact.source_id::uuid;
  END IF;
  
  -- Mark as verified
  UPDATE office_contacts
  SET 
    is_verified = true,
    verified_at = now(),
    updated_at = now()
  WHERE id = v_contact.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'already_verified', false,
    'nome', v_contact.nome,
    'lider_nome', COALESCE(v_leader.nome_completo, 'Líder')
  );
END;
$$;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.verify_contact_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_contact_by_code(text) TO authenticated;

-- Insert SMS verification template if not exists
INSERT INTO sms_templates (slug, nome, mensagem, categoria, variaveis, is_active)
VALUES (
  'verificacao-link-sms',
  'Link de Verificação SMS',
  '{{nome}}, confirme seu cadastro acessando: {{link_verificacao}}',
  'verificacao',
  '["nome", "link_verificacao"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  mensagem = EXCLUDED.mensagem,
  variaveis = EXCLUDED.variaveis;