-- Fix: Remove overly permissive public SELECT policy on lideres table
-- This policy was exposing all leader PII (phone, email, birthdate) to anyone

-- Create a SECURITY DEFINER function that returns ONLY needed columns for affiliate lookup
CREATE OR REPLACE FUNCTION public.get_leader_by_affiliate_token(_token text)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  cidade_id uuid,
  cidade_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.cidade_id,
    c.nome as cidade_nome
  FROM lideres l
  LEFT JOIN office_cities c ON c.id = l.cidade_id
  WHERE l.affiliate_token = _token
    AND l.is_active = true;
END;
$$;

-- Drop the dangerous policy that allows anyone to read all leader columns
DROP POLICY IF EXISTS "lideres_select_by_affiliate_token" ON public.lideres;