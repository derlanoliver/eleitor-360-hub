-- Remover versão antiga se existir
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recriar trigger com suporte a tenant_id correto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
  _tenant_id UUID;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  
  IF _role IN ('super_admin', 'super_user') THEN
    _tenant_id := NULL;
  ELSE
    _tenant_id := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
    
    IF _tenant_id IS NULL THEN
      SELECT id INTO _tenant_id 
      FROM tenants 
      WHERE slug = 'rafael-prudente' 
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    _role,
    _tenant_id
  );
  
  RETURN NEW;
END;
$$;

-- Recriar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();