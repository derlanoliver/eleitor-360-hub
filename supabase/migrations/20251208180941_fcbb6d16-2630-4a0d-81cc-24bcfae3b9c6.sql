
-- Atualizar políticas RLS da tabela events para usar has_admin_access()

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- Recriar políticas usando has_admin_access() que reconhece admin E super_admin
CREATE POLICY "Admins can update events" ON events 
  FOR UPDATE 
  USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));

CREATE POLICY "Admins can insert events" ON events 
  FOR INSERT 
  WITH CHECK (has_admin_access(auth.uid()));

CREATE POLICY "Admins can delete events" ON events 
  FOR DELETE 
  USING (has_admin_access(auth.uid()));
