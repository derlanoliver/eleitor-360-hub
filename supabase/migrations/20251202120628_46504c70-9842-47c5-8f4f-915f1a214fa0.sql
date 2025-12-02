-- Tabela para configurações de integrações externas
CREATE TABLE public.integrations_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Z-API WhatsApp
  zapi_instance_id TEXT,
  zapi_token TEXT,
  zapi_client_token TEXT,
  zapi_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integrations_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/modificar
CREATE POLICY "integrations_settings_select" ON public.integrations_settings
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "integrations_settings_modify" ON public.integrations_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_integrations_settings_updated_at
  BEFORE UPDATE ON public.integrations_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir registro inicial
INSERT INTO public.integrations_settings (zapi_enabled) VALUES (false);