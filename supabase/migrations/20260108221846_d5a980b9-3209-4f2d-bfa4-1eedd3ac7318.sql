-- Corrigir RLS da tabela campaigns para incluir super_admin
DROP POLICY IF EXISTS campaigns_modify ON campaigns;

CREATE POLICY campaigns_modify ON campaigns
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);