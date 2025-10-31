-- =====================================================
-- PHASE 2: REMOVE ALL TENANT REFERENCES FROM DATABASE
-- =====================================================

-- Step 1: Disable RLS temporarily
ALTER TABLE IF EXISTS office_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS office_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS office_leaders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS office_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS office_cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lideres DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (comprehensive)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I CASCADE', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Drop tenant-related functions
DROP FUNCTION IF EXISTS current_tenant() CASCADE;
DROP FUNCTION IF EXISTS header_tenant() CASCADE;
DROP FUNCTION IF EXISTS effective_tenant() CASCADE;
DROP FUNCTION IF EXISTS can_access_tenant(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_single_tenant_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_any_role(uuid, app_role[], uuid) CASCADE;

-- Step 4: Drop tenant-related tables
DROP TABLE IF EXISTS tenant_branding CASCADE;
DROP TABLE IF EXISTS tenant_domains CASCADE;
DROP TABLE IF EXISTS tenant_settings CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Step 5: Remove tenant_id columns
ALTER TABLE IF EXISTS lideres DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE IF EXISTS office_contacts DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE IF EXISTS office_leaders DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE IF EXISTS office_settings DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE IF EXISTS office_visits DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE IF EXISTS profiles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE IF EXISTS user_roles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS tenant_id CASCADE;

-- Step 6: Update generate_office_protocol function
CREATE OR REPLACE FUNCTION public.generate_office_protocol(_prefix text DEFAULT 'RP-GB'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _date TEXT;
  _sequence INTEGER;
  _protocol TEXT;
BEGIN
  _date := to_char(now(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(substring(protocolo from '[0-9]+$') AS INTEGER)), 0) + 1
  INTO _sequence
  FROM office_visits
  WHERE protocolo LIKE _prefix || '-' || _date || '-%';
  
  _protocol := _prefix || '-' || _date || '-' || lpad(_sequence::TEXT, 4, '0');
  
  RETURN _protocol;
END;
$$;

-- Step 7: Update update_leader_score function
CREATE OR REPLACE FUNCTION public.update_leader_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _settings RECORD;
  _form RECORD;
  _points INTEGER := 0;
BEGIN
  IF NEW.status IN ('FORM_SUBMITTED', 'CHECKED_IN') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('FORM_SUBMITTED', 'CHECKED_IN')) THEN
    
    SELECT pontos_form_submitted, pontos_aceita_reuniao
    INTO _settings
    FROM office_settings
    LIMIT 1;
    
    _points := COALESCE(_settings.pontos_form_submitted, 1);
    
    SELECT aceita_reuniao INTO _form
    FROM office_visit_forms
    WHERE visit_id = NEW.id;
    
    IF _form.aceita_reuniao THEN
      _points := _points + COALESCE(_settings.pontos_aceita_reuniao, 3);
    END IF;
    
    UPDATE office_leaders
    SET pontuacao_total = pontuacao_total + _points
    WHERE id = NEW.leader_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 8: Update has_role function (simplified without tenant)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 9: Recreate simplified RLS policies

-- Office Visits
ALTER TABLE office_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY office_visits_all ON office_visits FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));

-- Office Contacts
ALTER TABLE office_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY office_contacts_all ON office_contacts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));

-- Office Leaders
ALTER TABLE office_leaders ENABLE ROW LEVEL SECURITY;
CREATE POLICY office_leaders_select ON office_leaders FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));
CREATE POLICY office_leaders_modify ON office_leaders FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Office Settings
ALTER TABLE office_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY office_settings_select ON office_settings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));
CREATE POLICY office_settings_modify ON office_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Lideres
ALTER TABLE lideres ENABLE ROW LEVEL SECURITY;
CREATE POLICY lideres_all ON lideres FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));

-- User Roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_select ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_modify ON user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select ON users FOR SELECT TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY users_update ON users FOR UPDATE TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Step 10: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    true
  );
  RETURN NEW;
END;
$$;