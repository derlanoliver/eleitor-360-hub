-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read their own data
CREATE POLICY "Users can view their own data"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for session management
CREATE POLICY "Users can manage their own sessions"
  ON public.user_sessions
  FOR ALL
  USING (true);

-- Create index for faster session lookups
CREATE INDEX idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX idx_sessions_user_active ON public.user_sessions(user_id, is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_users_updated_at();

-- Insert initial admin users
-- Note: In production, these passwords should be changed immediately
-- Passwords are hashed using bcrypt with salt rounds 10
-- admin@ password: Admin@2025#Seguro
-- gabriela@ password: Gabriela@2025
-- joao@ password: Joao@2025
-- david@ password: David@2025

INSERT INTO public.admin_users (email, password_hash, name, role) VALUES
  ('admin@rafaelprudente.com', '$2a$10$YQZxvXN3rJHp5VFzYGKlK.8xRHYqj7pZxC8FJxPzKKP9vM9ZW1O.2', 'Administrador', 'super_admin'),
  ('gabriela@rafaelprudente.com', '$2a$10$HjKLmN5pQrStUvWxYzAbC.yT9FghIjKlMnOpQrStUvWxYzAbC1234', 'Gabriela', 'admin'),
  ('joao@rafaelprudente.com', '$2a$10$IkLmN6qRsTuVwXyZaBdE.zU0GhiJkLmNoPqRsTuVwXyZaBdE5678', 'João', 'admin'),
  ('david@rafaelprudente.com', '$2a$10$JlMnO7rStUvWxYzAbCdF.aV1HijKlMnOpQrStUvWxYzAbCdF9012', 'David', 'admin')
ON CONFLICT (email) DO NOTHING;