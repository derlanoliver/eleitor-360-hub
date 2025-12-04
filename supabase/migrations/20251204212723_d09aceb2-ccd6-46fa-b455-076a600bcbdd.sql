-- Atualizar user_roles para super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE user_id = '06889458-f16d-4681-a04e-a25081305128';

-- Também atualizar profiles.role para manter sincronizado
UPDATE profiles 
SET role = 'super_admin'
WHERE id = '06889458-f16d-4681-a04e-a25081305128';