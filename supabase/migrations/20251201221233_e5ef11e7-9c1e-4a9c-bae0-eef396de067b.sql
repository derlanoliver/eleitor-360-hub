-- Update existing RLS policy to allow INSERT for captacao and evento source types
DROP POLICY IF EXISTS "office_contacts_insert_public_form" ON public.office_contacts;

CREATE POLICY "office_contacts_insert_public_form" 
ON public.office_contacts 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (
  (source_type = 'lider' AND source_id IS NOT NULL) OR
  (source_type = 'captacao' AND source_id IS NOT NULL) OR
  (source_type = 'evento' AND source_id IS NOT NULL)
);