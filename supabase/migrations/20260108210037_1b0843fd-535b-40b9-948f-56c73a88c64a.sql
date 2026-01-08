-- Fix: permitir excluir funil mesmo com campanhas vinculadas (ON DELETE SET NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaigns_funnel_id_fkey'
  ) THEN
    ALTER TABLE public.campaigns DROP CONSTRAINT campaigns_funnel_id_fkey;
  END IF;
END $$;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_funnel_id_fkey
  FOREIGN KEY (funnel_id)
  REFERENCES public.lead_funnels(id)
  ON DELETE SET NULL;

-- Fix: permitir upload de assets do funil no bucket lead-funnel-assets (Storage RLS)
-- Policies em storage.objects precisam permitir INSERT/UPDATE/DELETE para admins.
DROP POLICY IF EXISTS "Admins can upload lead funnel assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lead funnel assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lead funnel assets" ON storage.objects;

CREATE POLICY "Admins can upload lead funnel assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lead-funnel-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Admins can update lead funnel assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lead-funnel-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
)
WITH CHECK (
  bucket_id = 'lead-funnel-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Admins can delete lead funnel assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lead-funnel-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);
