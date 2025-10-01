-- Create a secure function to authenticate admin users
-- This function validates the password using pgcrypto and returns user data if successful
CREATE OR REPLACE FUNCTION public.authenticate_admin_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  password_hash TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.password_hash
  FROM admin_users u
  WHERE u.email = LOWER(TRIM(p_email))
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;