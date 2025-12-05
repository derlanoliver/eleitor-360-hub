-- Create SECURITY DEFINER function for public unsubscribe
CREATE OR REPLACE FUNCTION public.unsubscribe_contact_by_token(p_token text, p_reason text DEFAULT 'Solicitação via email')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact record;
BEGIN
  -- Find contact by token
  SELECT id, nome, is_active INTO v_contact
  FROM office_contacts
  WHERE unsubscribe_token = p_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'token_invalid');
  END IF;
  
  IF NOT v_contact.is_active THEN
    RETURN jsonb_build_object('success', true, 'already_unsubscribed', true, 'nome', v_contact.nome);
  END IF;
  
  -- Update contact to inactive
  UPDATE office_contacts SET
    is_active = false,
    opted_out_at = now(),
    opt_out_reason = p_reason,
    opt_out_channel = 'email'
  WHERE id = v_contact.id;
  
  RETURN jsonb_build_object('success', true, 'nome', v_contact.nome);
END;
$$;