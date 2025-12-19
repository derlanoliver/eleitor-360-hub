-- Add tipo column to office_cities
ALTER TABLE office_cities 
ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'DF';

-- Add constraint for valid types
ALTER TABLE office_cities 
ADD CONSTRAINT office_cities_tipo_check 
CHECK (tipo IN ('DF', 'ENTORNO'));

-- Insert Entorno cities
INSERT INTO office_cities (nome, codigo_ra, tipo, status) VALUES
('Águas Lindas de Goiás', 'ENT-01', 'ENTORNO', 'active'),
('Cidade Ocidental', 'ENT-02', 'ENTORNO', 'active'),
('Formosa', 'ENT-03', 'ENTORNO', 'active'),
('Luziânia', 'ENT-04', 'ENTORNO', 'active'),
('Novo Gama', 'ENT-05', 'ENTORNO', 'active'),
('Planaltina de Goiás', 'ENT-06', 'ENTORNO', 'active'),
('Santo Antônio do Descoberto', 'ENT-07', 'ENTORNO', 'active'),
('Valparaíso de Goiás', 'ENT-08', 'ENTORNO', 'active'),
('Alexânia', 'ENT-09', 'ENTORNO', 'active'),
('Cristalina', 'ENT-10', 'ENTORNO', 'active'),
('Padre Bernardo', 'ENT-11', 'ENTORNO', 'active'),
('Unaí', 'ENT-12', 'ENTORNO', 'active')
ON CONFLICT DO NOTHING;