-- Marcar tabela regiao_administrativa como deprecated
COMMENT ON TABLE regiao_administrativa IS 'DEPRECATED: Use office_cities instead. This table will be removed in a future migration. All new code should use office_cities table.';

-- Adicionar comentário explicativo na tabela office_cities
COMMENT ON TABLE office_cities IS 'Official table for administrative regions (Regiões Administrativas) of Distrito Federal. This is the single source of truth for all RA data in the system.';