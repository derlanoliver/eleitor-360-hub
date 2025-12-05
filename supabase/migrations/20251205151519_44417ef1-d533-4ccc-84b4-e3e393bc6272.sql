-- Fix overly permissive RLS policies on office_contacts

-- 1. Drop the problematic SELECT policy that exposes all contacts
DROP POLICY IF EXISTS office_contacts_select_for_upsert ON office_contacts;

-- 2. Drop the problematic UPDATE policy that allows anyone to update any contact
DROP POLICY IF EXISTS office_contacts_update_public_form ON office_contacts;

-- 3. Create a more restrictive policy for public form submissions
-- This allows SELECT only for contacts being looked up by their own phone number during upsert operations
-- Using a SECURITY DEFINER function approach instead for safety

-- Create a function for safe contact upsert during public registrations
CREATE OR REPLACE FUNCTION public.upsert_contact_from_public_form(
  _nome TEXT,
  _telefone_norm TEXT,
  _email TEXT DEFAULT NULL,
  _cidade_id UUID DEFAULT NULL,
  _source_type TEXT DEFAULT NULL,
  _source_id UUID DEFAULT NULL,
  _utm_source TEXT DEFAULT NULL,
  _utm_medium TEXT DEFAULT NULL,
  _utm_campaign TEXT DEFAULT NULL,
  _utm_content TEXT DEFAULT NULL,
  _data_nascimento DATE DEFAULT NULL,
  _endereco TEXT DEFAULT NULL,
  _facebook TEXT DEFAULT NULL,
  _instagram TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contact_id UUID;
BEGIN
  -- Check if contact exists by phone
  SELECT id INTO _contact_id
  FROM office_contacts
  WHERE telefone_norm = _telefone_norm
  LIMIT 1;
  
  IF _contact_id IS NOT NULL THEN
    -- Update existing contact with new data if provided
    UPDATE office_contacts
    SET 
      email = COALESCE(_email, email),
      cidade_id = COALESCE(_cidade_id, cidade_id),
      data_nascimento = COALESCE(_data_nascimento, data_nascimento),
      endereco = COALESCE(_endereco, endereco),
      facebook = COALESCE(_facebook, facebook),
      instagram = COALESCE(_instagram, instagram),
      updated_at = now()
    WHERE id = _contact_id;
  ELSE
    -- Insert new contact
    INSERT INTO office_contacts (
      nome, telefone_norm, email, cidade_id, source_type, source_id,
      utm_source, utm_medium, utm_campaign, utm_content,
      data_nascimento, endereco, facebook, instagram
    ) VALUES (
      _nome, _telefone_norm, _email, _cidade_id, _source_type, _source_id,
      _utm_source, _utm_medium, _utm_campaign, _utm_content,
      _data_nascimento, _endereco, _facebook, _instagram
    )
    RETURNING id INTO _contact_id;
  END IF;
  
  RETURN _contact_id;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_public_form TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_public_form TO authenticated;