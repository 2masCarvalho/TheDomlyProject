-- Per-condominium memberships and invite tokens
-- Depends on: user_role enum (created in 20260304_mvp_condos_roles_docs_templates.sql)
--
-- NOTE: condominios.id_user is UUID in the DB (TypeScript treats it as string).
-- All comparisons against auth.uid() cast BOTH sides to text to avoid
-- "operator does not exist: uuid = text" errors, matching the pattern used
-- throughout the existing migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── invite_tokens ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invite_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  id_condominio INTEGER     NOT NULL REFERENCES condominios(id_comdominio) ON DELETE CASCADE,
  role          user_role   NOT NULL DEFAULT 'residente',
  created_by    TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at       TIMESTAMPTZ,
  used_by       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can read tokens (needed by the join page before the user is logged in).
DROP POLICY IF EXISTS "it_select_public" ON invite_tokens;
CREATE POLICY "it_select_public" ON invite_tokens FOR SELECT USING (true);

-- Only the condo owner can create tokens for their condominios.
DROP POLICY IF EXISTS "it_insert_owner" ON invite_tokens;
CREATE POLICY "it_insert_owner" ON invite_tokens FOR INSERT TO authenticated
  WITH CHECK (
    created_by::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

-- An authenticated user can mark a token as used (claiming it).
DROP POLICY IF EXISTS "it_update_claim" ON invite_tokens;
CREATE POLICY "it_update_claim" ON invite_tokens FOR UPDATE TO authenticated
  USING  (used_at IS NULL)
  WITH CHECK (used_by::text = auth.uid()::text);

-- The token creator can delete (revoke) their own tokens.
DROP POLICY IF EXISTS "it_delete_owner" ON invite_tokens;
CREATE POLICY "it_delete_owner" ON invite_tokens FOR DELETE TO authenticated
  USING (created_by::text = auth.uid()::text);


-- ── condominio_memberships ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS condominio_memberships (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  id_condominio    INTEGER     NOT NULL REFERENCES condominios(id_comdominio) ON DELETE CASCADE,
  id_user          TEXT        NOT NULL,
  role             user_role   NOT NULL DEFAULT 'residente',
  nome_utilizador  TEXT,
  email_utilizador TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id_condominio, id_user)
);

ALTER TABLE condominio_memberships ENABLE ROW LEVEL SECURITY;

-- A member can see their own memberships.
DROP POLICY IF EXISTS "cm_select_own" ON condominio_memberships;
CREATE POLICY "cm_select_own" ON condominio_memberships FOR SELECT TO authenticated
  USING (id_user::text = auth.uid()::text);

-- The condo owner can see all memberships for their condominios.
DROP POLICY IF EXISTS "cm_select_owner" ON condominio_memberships;
CREATE POLICY "cm_select_owner" ON condominio_memberships FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

-- An authenticated user can insert their own membership (when claiming an invite).
DROP POLICY IF EXISTS "cm_insert_self" ON condominio_memberships;
CREATE POLICY "cm_insert_self" ON condominio_memberships FOR INSERT TO authenticated
  WITH CHECK (id_user::text = auth.uid()::text);

-- The condo owner can remove any membership.
DROP POLICY IF EXISTS "cm_delete_owner" ON condominio_memberships;
CREATE POLICY "cm_delete_owner" ON condominio_memberships FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );
