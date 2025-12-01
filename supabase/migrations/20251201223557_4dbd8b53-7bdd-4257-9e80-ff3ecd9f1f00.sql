-- Drop existing CHECK constraint and recreate with 'captacao' included
ALTER TABLE public.office_contacts 
DROP CONSTRAINT IF EXISTS office_contacts_source_type_check;

ALTER TABLE public.office_contacts 
ADD CONSTRAINT office_contacts_source_type_check 
CHECK (source_type = ANY (ARRAY[
  'lider'::text, 
  'campanha'::text, 
  'evento'::text, 
  'afiliado'::text, 
  'manual'::text,
  'captacao'::text
]));