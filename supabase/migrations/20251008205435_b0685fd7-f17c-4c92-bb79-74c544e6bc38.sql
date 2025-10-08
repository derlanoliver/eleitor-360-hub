-- ============================================================================
-- Migration 02: Catálogos Globais
-- Renomeia tabelas de catálogo e cria índices (SEM tenant_id)
-- ============================================================================

-- Renomear cadastros_ra -> regiao_administrativa
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='cadastros_ra'
  ) THEN
    ALTER TABLE cadastros_ra RENAME TO regiao_administrativa;
  END IF;
END$$;

-- Renomear temas_interesse -> temas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='temas_interesse'
  ) THEN
    ALTER TABLE temas_interesse RENAME TO temas;
  END IF;
END$$;

-- Criar índices para performance (idempotente)
CREATE INDEX IF NOT EXISTS idx_ra_ra ON regiao_administrativa(ra);
CREATE INDEX IF NOT EXISTS idx_temas_tema ON temas(tema);

-- perfil_demografico: manter como está (decisão em bloco futuro)