-- 1. Criar tabela de materiais por região
CREATE TABLE public.region_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES office_cities(id) ON DELETE CASCADE,
  material_url TEXT NOT NULL,
  material_name TEXT NOT NULL,
  sms_template_slug TEXT DEFAULT 'material-regiao-sms',
  delay_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.region_materials ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso - leitura para todos autenticados
CREATE POLICY "region_materials_select" ON region_materials
  FOR SELECT TO authenticated USING (true);

-- 4. Políticas de inserção para admins
CREATE POLICY "region_materials_insert" ON region_materials
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- 5. Políticas de atualização para admins
CREATE POLICY "region_materials_update" ON region_materials
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- 6. Políticas de exclusão para admins
CREATE POLICY "region_materials_delete" ON region_materials
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- 7. Adicionar configuração global de delay na tabela integrations_settings
ALTER TABLE integrations_settings 
ADD COLUMN IF NOT EXISTS region_material_default_delay_minutes INTEGER DEFAULT 60;

-- 8. Criar bucket para materiais regionais (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('region-materials', 'region-materials', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Política de leitura pública para o bucket
CREATE POLICY "region_materials_bucket_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'region-materials');

-- 10. Política de upload para admins
CREATE POLICY "region_materials_bucket_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'region-materials' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

-- 11. Política de exclusão para admins
CREATE POLICY "region_materials_bucket_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'region-materials' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

-- 12. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_region_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_region_materials_updated_at_trigger
BEFORE UPDATE ON region_materials
FOR EACH ROW
EXECUTE FUNCTION update_region_materials_updated_at();