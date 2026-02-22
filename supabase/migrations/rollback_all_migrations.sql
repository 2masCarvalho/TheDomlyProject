-- ============================================================
-- ROLLBACK SCRIPT — undoes all_migrations_combined.sql
-- Run this to return the database to its state BEFORE the
-- three new features were applied.
--
-- Safe to run even if the migration was only partially applied
-- (all statements use IF EXISTS guards).
--
-- WARNING: This permanently deletes any data already entered
-- in ocorrencias, trabalhos_manutencao, tecnicos, and
-- candidaturas_trabalho. The ativos columns will also be
-- dropped with any values stored in them.
-- ============================================================


-- ── Step 1: Drop candidaturas_trabalho first
--    (has FK refs to trabalhos_manutencao AND tecnicos)
DROP TABLE IF EXISTS candidaturas_trabalho;


-- ── Step 2: Remove the circular FK that links ocorrencias → trabalhos_manutencao
--    (added at the end of the migration; must go before dropping either table)
ALTER TABLE ocorrencias
  DROP CONSTRAINT IF EXISTS ocorrencias_id_trabalho_fkey;


-- ── Step 3: Drop trabalhos_manutencao
--    (has FK ref to ocorrencias via id_ocorrencia, and to tecnicos)
DROP TRIGGER IF EXISTS update_trabalhos_updated_at ON trabalhos_manutencao;
DROP TABLE IF EXISTS trabalhos_manutencao;


-- ── Step 4: Drop ocorrencias
DROP TRIGGER IF EXISTS update_ocorrencias_updated_at ON ocorrencias;
DROP TABLE IF EXISTS ocorrencias;


-- ── Step 5: Drop tecnicos
DROP TABLE IF EXISTS tecnicos;


-- ── Step 6: Remove trigger and columns added to ativos
--
-- NOTE: updated_at is intentionally NOT dropped here.
-- It already existed in the ativos table before these migrations
-- (visible in the auto-generated types.ts). Dropping it would
-- damage the pre-existing schema.
DROP TRIGGER IF EXISTS update_ativos_updated_at ON ativos;

ALTER TABLE ativos
  DROP COLUMN IF EXISTS tipo_ativo,
  DROP COLUMN IF EXISTS data_expiracao,
  DROP COLUMN IF EXISTS data_ultima_manutencao,
  DROP COLUMN IF EXISTS empresa_responsavel,
  DROP COLUMN IF EXISTS contacto_empresa,
  DROP COLUMN IF EXISTS estado_licenca;


-- ── Step 7: Drop the shared trigger function
--    (safe now that all triggers that use it have been dropped above)
DROP FUNCTION IF EXISTS update_updated_at_column();
