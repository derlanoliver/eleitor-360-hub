-- Drop existing policies
DROP POLICY IF EXISTS "Admins can upload event covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event covers" ON storage.objects;

-- Recreate with has_admin_access() to support both admin and super_admin
CREATE POLICY "Admins can upload event covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-covers' 
  AND has_admin_access(auth.uid())
);

CREATE POLICY "Admins can update event covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-covers' 
  AND has_admin_access(auth.uid())
);

CREATE POLICY "Admins can delete event covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-covers' 
  AND has_admin_access(auth.uid())
);