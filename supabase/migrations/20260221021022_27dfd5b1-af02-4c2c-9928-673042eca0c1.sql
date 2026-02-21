
-- Tipos de materiais de campanha
CREATE TABLE public.campaign_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'outro',
  descricao TEXT,
  quantidade_produzida INTEGER NOT NULL DEFAULT 0,
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'unidade',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_materials_select" ON public.campaign_materials
FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "campaign_materials_modify" ON public.campaign_materials
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Retiradas de material
CREATE TABLE public.material_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.campaign_materials(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES public.lideres(id),
  quantidade INTEGER NOT NULL,
  data_retirada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmado BOOLEAN NOT NULL DEFAULT false,
  confirmado_at TIMESTAMP WITH TIME ZONE,
  observacao TEXT,
  registrado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.material_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "material_withdrawals_select" ON public.material_withdrawals
FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "material_withdrawals_modify" ON public.material_withdrawals
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger para atualizar estoque ao registrar retirada
CREATE OR REPLACE FUNCTION public.update_material_stock_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.campaign_materials
    SET estoque_atual = estoque_atual - NEW.quantidade,
        updated_at = now()
    WHERE id = NEW.material_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.campaign_materials
    SET estoque_atual = estoque_atual + OLD.quantidade,
        updated_at = now()
    WHERE id = OLD.material_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.quantidade != NEW.quantidade THEN
    UPDATE public.campaign_materials
    SET estoque_atual = estoque_atual + OLD.quantidade - NEW.quantidade,
        updated_at = now()
    WHERE id = NEW.material_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_material_stock
AFTER INSERT OR UPDATE OR DELETE ON public.material_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.update_material_stock_on_withdrawal();

-- Trigger updated_at
CREATE TRIGGER update_campaign_materials_updated_at
BEFORE UPDATE ON public.campaign_materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_withdrawals_updated_at
BEFORE UPDATE ON public.material_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
