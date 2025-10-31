-- =====================================================
-- FIX SECURITY WARNINGS: ADD MISSING RLS POLICIES
-- =====================================================

-- Enable RLS on office_cities if not already enabled
ALTER TABLE office_cities ENABLE ROW LEVEL SECURITY;

-- Create policies for office_cities (public read, admin write)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_cities' AND policyname = 'office_cities_select_all') THEN
    CREATE POLICY office_cities_select_all ON office_cities
    FOR SELECT TO authenticated
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_cities' AND policyname = 'office_cities_modify') THEN
    CREATE POLICY office_cities_modify ON office_cities
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Enable RLS on office_visit_forms if not already enabled
ALTER TABLE office_visit_forms ENABLE ROW LEVEL SECURITY;

-- Create policies for office_visit_forms (public insert, authenticated read/update)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_visit_forms' AND policyname = 'office_visit_forms_insert_public') THEN
    CREATE POLICY office_visit_forms_insert_public ON office_visit_forms
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_visit_forms' AND policyname = 'office_visit_forms_select') THEN
    CREATE POLICY office_visit_forms_select ON office_visit_forms
    FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'office_visit_forms' AND policyname = 'office_visit_forms_update') THEN
    CREATE POLICY office_visit_forms_update ON office_visit_forms
    FOR UPDATE TO authenticated
    USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Ensure RLS on platform_admins
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Check for tables without RLS in public schema and enable it
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN (
      SELECT tablename 
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE c.relrowsecurity = true
      AND t.schemaname = 'public'
    )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;