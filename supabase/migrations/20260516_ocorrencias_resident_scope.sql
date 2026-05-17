-- ─────────────────────────────────────────────────────────────────────────────
-- Resident scope for ocorrências + ocorrencia-fotos storage
--
-- Prepares the database for a resident-facing React Native app:
--   1. Adds `created_by` to ocorrencias so residents can filter "my reports".
--   2. Replaces the existing permissive policies (every authenticated user
--      could see/insert/update/delete every report) with policies scoped to
--      condominio ownership + condominio_memberships.
--   3. Adds storage RLS on the `ocorrencia-fotos` bucket so residents can
--      only upload photos into `condominios/{id}/...` for buildings they
--      belong to.
--
-- Backwards-compat: the web app's gestor flows continue to work via the
-- owner branch of every policy. `src/api/ocorrencias.ts:71-79` does NOT
-- set `created_by` today; the INSERT WITH CHECK allows NULL so this keeps
-- working until the web layer is updated.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Schema additions ───────────────────────────────────────────────────────

ALTER TABLE ocorrencias
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ocorrencias_created_by
  ON ocorrencias(created_by);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_condominio_estado
  ON ocorrencias(id_condominio, estado);

-- 2. Drop existing permissive policies ──────────────────────────────────────
-- These currently grant USING (true) to all authenticated users.

DROP POLICY IF EXISTS "Allow authenticated to select ocorrencias" ON ocorrencias;
DROP POLICY IF EXISTS "Allow authenticated to insert ocorrencias" ON ocorrencias;
DROP POLICY IF EXISTS "Allow authenticated to update ocorrencias" ON ocorrencias;
DROP POLICY IF EXISTS "Allow authenticated to delete ocorrencias" ON ocorrencias;

-- 3. New scoped policies ────────────────────────────────────────────────────
-- Note: the condominios PK is misspelled as `id_comdominio` in the existing
-- schema (see 20260416_condominio_memberships.sql:16). Keep the typo.

CREATE POLICY "ocorrencias_select_scoped" ON ocorrencias FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = ocorrencias.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM condominio_memberships m
      WHERE m.id_condominio = ocorrencias.id_condominio
        AND m.id_user::text = auth.uid()::text
    )
  );

CREATE POLICY "ocorrencias_insert_member" ON ocorrencias FOR INSERT TO authenticated
  WITH CHECK (
    (created_by IS NULL OR created_by::text = auth.uid()::text)
    AND (
      EXISTS (
        SELECT 1 FROM condominios c
        WHERE c.id_comdominio = id_condominio
          AND c.id_user::text = auth.uid()::text
      )
      OR EXISTS (
        SELECT 1 FROM condominio_memberships m
        WHERE m.id_condominio = id_condominio
          AND m.id_user::text = auth.uid()::text
      )
    )
  );

CREATE POLICY "ocorrencias_update_owner" ON ocorrencias FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = ocorrencias.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

CREATE POLICY "ocorrencias_delete_owner" ON ocorrencias FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = ocorrencias.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

-- 4. Storage bucket policies for `ocorrencia-fotos` ─────────────────────────
-- The bucket already exists in production but has no migration-tracked
-- policies. Bake them in here so they're version-controlled.

INSERT INTO storage.buckets (id, name, public)
VALUES ('ocorrencia-fotos', 'ocorrencia-fotos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ocorrencia_fotos_select_public" ON storage.objects;
CREATE POLICY "ocorrencia_fotos_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'ocorrencia-fotos');

DROP POLICY IF EXISTS "ocorrencia_fotos_insert_member" ON storage.objects;
CREATE POLICY "ocorrencia_fotos_insert_member" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ocorrencia-fotos'
    AND (storage.foldername(name))[1] = 'condominios'
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio::text = (storage.foldername(name))[2]
        AND (
          c.id_user::text = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM condominio_memberships m
            WHERE m.id_condominio = c.id_comdominio
              AND m.id_user::text = auth.uid()::text
          )
        )
    )
  );

DROP POLICY IF EXISTS "ocorrencia_fotos_delete_owner" ON storage.objects;
CREATE POLICY "ocorrencia_fotos_delete_owner" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ocorrencia-fotos'
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio::text = (storage.foldername(name))[2]
        AND c.id_user::text = auth.uid()::text
    )
  );
