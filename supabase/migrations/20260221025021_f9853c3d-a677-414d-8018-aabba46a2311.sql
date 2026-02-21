
-- Add image_url column to campaign_materials
ALTER TABLE public.campaign_materials ADD COLUMN image_url text;

-- Create storage bucket for material images
INSERT INTO storage.buckets (id, name, public) VALUES ('material-images', 'material-images', true);

-- Allow anyone to view material images
CREATE POLICY "material_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'material-images');

-- Allow super_admin to upload/update/delete material images
CREATE POLICY "material_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'material-images' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "material_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'material-images' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "material_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'material-images' AND has_role(auth.uid(), 'super_admin'::app_role));
