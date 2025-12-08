-- Create SECURITY DEFINER function to update verification_sent_at
CREATE OR REPLACE FUNCTION public.update_contact_verification_sent(_contact_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE office_contacts
  SET verification_sent_at = now()
  WHERE id = _contact_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.update_contact_verification_sent(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.update_contact_verification_sent(UUID) TO authenticated;