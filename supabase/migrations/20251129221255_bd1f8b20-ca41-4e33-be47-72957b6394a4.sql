-- Adicionar colunas para referência ao evento nas campanhas
ALTER TABLE campaigns ADD COLUMN event_id UUID REFERENCES events(id);
ALTER TABLE campaigns ADD COLUMN event_slug TEXT;