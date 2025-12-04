-- 1. contact_page_views - corrigir para usar has_admin_access
DROP POLICY IF EXISTS "contact_page_views_select_auth" ON public.contact_page_views;
CREATE POLICY "contact_page_views_select_auth" ON public.contact_page_views
  FOR SELECT
  USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- 2. contact_downloads - corrigir para usar has_admin_access
DROP POLICY IF EXISTS "contact_downloads_select_auth" ON public.contact_downloads;
CREATE POLICY "contact_downloads_select_auth" ON public.contact_downloads
  FOR SELECT
  USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- 3. event_registrations - SELECT para admins
DROP POLICY IF EXISTS "Event registrations viewable by admins" ON public.event_registrations;
CREATE POLICY "Event registrations viewable by admins" ON public.event_registrations
  FOR SELECT
  USING (has_admin_access(auth.uid()));

-- 3b. event_registrations - UPDATE para admins
DROP POLICY IF EXISTS "Admins can update registrations" ON public.event_registrations;
CREATE POLICY "Admins can update registrations" ON public.event_registrations
  FOR UPDATE
  USING (has_admin_access(auth.uid()));

-- 3c. event_registrations - DELETE para admins
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.event_registrations;
CREATE POLICY "Admins can delete registrations" ON public.event_registrations
  FOR DELETE
  USING (has_admin_access(auth.uid()));

-- 4. page_views - corrigir para usar has_admin_access
DROP POLICY IF EXISTS "page_views_select_admin" ON public.page_views;
CREATE POLICY "page_views_select_admin" ON public.page_views
  FOR SELECT
  USING (has_admin_access(auth.uid()));