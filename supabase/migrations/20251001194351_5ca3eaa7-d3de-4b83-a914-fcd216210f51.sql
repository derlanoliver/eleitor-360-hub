-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update password hashes for all admin users using pgcrypto's crypt function
-- This regenerates the bcrypt hashes using the same passwords

UPDATE admin_users SET password_hash = crypt('Admin@2025#Seguro', gen_salt('bf', 10)) WHERE email = 'admin@rafaelprudente.com';
UPDATE admin_users SET password_hash = crypt('Gabriela@2025', gen_salt('bf', 10)) WHERE email = 'gabriela@rafaelprudente.com';
UPDATE admin_users SET password_hash = crypt('Joao@2025', gen_salt('bf', 10)) WHERE email = 'joao@rafaelprudente.com';
UPDATE admin_users SET password_hash = crypt('David@2025', gen_salt('bf', 10)) WHERE email = 'david@rafaelprudente.com';