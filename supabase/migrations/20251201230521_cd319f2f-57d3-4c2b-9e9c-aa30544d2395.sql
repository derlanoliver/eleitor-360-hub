-- Adicionar colunas para suporte a funis de captação nas campanhas UTM
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES lead_funnels(id),
ADD COLUMN IF NOT EXISTS funnel_slug text;

-- Comentário explicativo
COMMENT ON COLUMN campaigns.funnel_id IS 'ID do funil de captação associado (alternativa a event_id)';
COMMENT ON COLUMN campaigns.funnel_slug IS 'Slug do funil de captação para geração de URL';