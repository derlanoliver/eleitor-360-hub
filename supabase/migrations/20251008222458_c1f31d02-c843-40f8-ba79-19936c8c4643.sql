-- Atualizar função handle_new_user para suportar tenant_id corretamente
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
  -- Extrair role do user_metadata
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  
  -- Determinar tenant_id baseado na role
  IF _role IN ('super_admin', 'super_user') THEN
    -- Roles globais não têm tenant
    _tenant_id := NULL;
  ELSE
    -- Tentar obter tenant_id do user_metadata
    _tenant_id := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
    
    -- Se não fornecido, buscar tenant padrão (Rafael Prudente)
    IF _tenant_id IS NULL THEN
      SELECT id INTO _tenant_id 
      FROM tenants 
      WHERE slug = 'rafael-prudente' 
      LIMIT 1;
    END IF;
  END IF;

  -- Inserir perfil com tenant_id apropriado
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