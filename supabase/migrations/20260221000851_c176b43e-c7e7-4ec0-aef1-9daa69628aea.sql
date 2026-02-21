
-- Table to persist AI-generated public opinion insights
CREATE TABLE public.po_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.po_monitored_entities(id) ON DELETE CASCADE,
  period_days INTEGER NOT NULL DEFAULT 7,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.po_insights ENABLE ROW LEVEL SECURITY;

-- Only super_admins can access
CREATE POLICY "po_insights_select"
  ON public.po_insights FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "po_insights_modify"
  ON public.po_insights FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Index for quick lookups
CREATE INDEX idx_po_insights_entity_generated ON public.po_insights(entity_id, generated_at DESC);
