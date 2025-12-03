-- Atualizar função handle_new_user para inserir em AMBAS as tabelas
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Inserir na tabela users
  INSERT INTO public.users (id, email, name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    true
  );
  
  -- Inserir na tabela profiles
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  
  RETURN NEW;
END;
$function$;

-- Inserir perfis faltando para usuários existentes
INSERT INTO profiles (id, email, name, role, created_at)
SELECT u.id, u.email, u.name, 'admin', u.created_at
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;