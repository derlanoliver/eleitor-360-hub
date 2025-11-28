-- Create app_settings table for tracking configurations
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facebook_pixel_id TEXT,
  facebook_api_token TEXT,
  facebook_pixel_code TEXT,
  gtm_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for public pages to access tracking configs)
CREATE POLICY "app_settings_select_public" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Allow admins to modify settings
CREATE POLICY "app_settings_modify" 
ON public.app_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.app_settings (id) VALUES (gen_random_uuid());