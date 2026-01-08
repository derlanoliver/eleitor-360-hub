-- Remover política existente
DROP POLICY IF EXISTS lead_funnels_modify ON lead_funnels;

-- Criar nova política que inclui super_admin
CREATE POLICY lead_funnels_modify ON lead_funnels
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