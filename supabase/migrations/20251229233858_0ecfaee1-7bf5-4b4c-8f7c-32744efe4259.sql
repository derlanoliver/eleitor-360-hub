-- Função para sincronizar last_login quando usuário faz login
CREATE OR REPLACE FUNCTION public.sync_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualiza quando last_sign_in_at muda (indica novo login)
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.users
    SET last_login = NEW.last_sign_in_at, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger na tabela auth.users para detectar logins
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_last_login();

-- Sincronizar last_login existente do auth.users para usuários atuais
UPDATE public.users u
SET last_login = au.last_sign_in_at
FROM auth.users au
WHERE u.id = au.id
AND au.last_sign_in_at IS NOT NULL;