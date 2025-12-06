-- Adicionar colunas de coordenadas na tabela office_cities
ALTER TABLE office_cities 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Popular coordenadas das 33 RAs do Distrito Federal
UPDATE office_cities SET latitude = -15.7942, longitude = -47.8825 WHERE codigo_ra = 'RA-01'; -- Brasília/Plano Piloto
UPDATE office_cities SET latitude = -15.8363, longitude = -47.9064 WHERE codigo_ra = 'RA-02'; -- Gama
UPDATE office_cities SET latitude = -15.8363, longitude = -48.0514 WHERE codigo_ra = 'RA-03'; -- Taguatinga
UPDATE office_cities SET latitude = -15.8797, longitude = -47.7962 WHERE codigo_ra = 'RA-04'; -- Brazlândia
UPDATE office_cities SET latitude = -15.8797, longitude = -47.9544 WHERE codigo_ra = 'RA-05'; -- Sobradinho
UPDATE office_cities SET latitude = -15.6185, longitude = -47.6574 WHERE codigo_ra = 'RA-06'; -- Planaltina
UPDATE office_cities SET latitude = -15.7825, longitude = -47.8992 WHERE codigo_ra = 'RA-07'; -- Paranoá
UPDATE office_cities SET latitude = -15.8311, longitude = -47.9927 WHERE codigo_ra = 'RA-08'; -- Núcleo Bandeirante
UPDATE office_cities SET latitude = -15.8533, longitude = -48.0617 WHERE codigo_ra = 'RA-09'; -- Ceilândia
UPDATE office_cities SET latitude = -15.7744, longitude = -47.8919 WHERE codigo_ra = 'RA-10'; -- Guará
UPDATE office_cities SET latitude = -15.8483, longitude = -47.8003 WHERE codigo_ra = 'RA-11'; -- Cruzeiro
UPDATE office_cities SET latitude = -15.8667, longitude = -48.0333 WHERE codigo_ra = 'RA-12'; -- Samambaia
UPDATE office_cities SET latitude = -15.8178, longitude = -47.8878 WHERE codigo_ra = 'RA-13'; -- Santa Maria
UPDATE office_cities SET latitude = -15.8300, longitude = -47.9550 WHERE codigo_ra = 'RA-14'; -- São Sebastião
UPDATE office_cities SET latitude = -15.8889, longitude = -48.0803 WHERE codigo_ra = 'RA-15'; -- Recanto das Emas
UPDATE office_cities SET latitude = -15.7800, longitude = -47.8200 WHERE codigo_ra = 'RA-16'; -- Lago Sul
UPDATE office_cities SET latitude = -15.8628, longitude = -48.0100 WHERE codigo_ra = 'RA-17'; -- Riacho Fundo
UPDATE office_cities SET latitude = -15.7400, longitude = -47.8400 WHERE codigo_ra = 'RA-18'; -- Lago Norte
UPDATE office_cities SET latitude = -15.7350, longitude = -47.9350 WHERE codigo_ra = 'RA-19'; -- Candangolândia
UPDATE office_cities SET latitude = -15.8700, longitude = -48.1050 WHERE codigo_ra = 'RA-20'; -- Águas Claras
UPDATE office_cities SET latitude = -15.8650, longitude = -48.0250 WHERE codigo_ra = 'RA-21'; -- Riacho Fundo II
UPDATE office_cities SET latitude = -15.7550, longitude = -47.8950 WHERE codigo_ra = 'RA-22'; -- Sudoeste/Octogonal
UPDATE office_cities SET latitude = -15.7300, longitude = -47.8850 WHERE codigo_ra = 'RA-23'; -- Varjão
UPDATE office_cities SET latitude = -15.7100, longitude = -47.8100 WHERE codigo_ra = 'RA-24'; -- Park Way
UPDATE office_cities SET latitude = -15.6600, longitude = -47.8000 WHERE codigo_ra = 'RA-25'; -- SCIA/Estrutural
UPDATE office_cities SET latitude = -15.8850, longitude = -47.9800 WHERE codigo_ra = 'RA-26'; -- Sobradinho II
UPDATE office_cities SET latitude = -15.7000, longitude = -47.7500 WHERE codigo_ra = 'RA-27'; -- Jardim Botânico
UPDATE office_cities SET latitude = -15.8250, longitude = -47.9700 WHERE codigo_ra = 'RA-28'; -- Itapoã
UPDATE office_cities SET latitude = -15.7600, longitude = -47.8700 WHERE codigo_ra = 'RA-29'; -- SIA
UPDATE office_cities SET latitude = -15.8400, longitude = -48.1200 WHERE codigo_ra = 'RA-30'; -- Vicente Pires
UPDATE office_cities SET latitude = -15.6300, longitude = -47.6800 WHERE codigo_ra = 'RA-31'; -- Fercal
UPDATE office_cities SET latitude = -15.8550, longitude = -48.0950 WHERE codigo_ra = 'RA-32'; -- Sol Nascente/Pôr do Sol
UPDATE office_cities SET latitude = -15.6800, longitude = -47.8600 WHERE codigo_ra = 'RA-33'; -- Arniqueira

-- Fallback para cidades sem codigo_ra específico (usar centro do DF)
UPDATE office_cities SET latitude = -15.7801, longitude = -47.9292 WHERE latitude IS NULL;