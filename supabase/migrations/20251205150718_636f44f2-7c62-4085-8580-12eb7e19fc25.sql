-- Fix RLS policy on user_roles to recognize super_admin
DROP POLICY IF EXISTS user_roles_modify ON user_roles;

CREATE POLICY user_roles_modify ON user_roles
  FOR ALL
  TO authenticated
  USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));