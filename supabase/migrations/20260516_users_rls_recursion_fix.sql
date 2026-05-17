-- ─────────────────────────────────────────────────────────────────────────────
-- Fix infinite-recursion RLS on public.users
--
-- The "users_select_company_if_manager" and "users_update_company_if_manager"
-- policies added in 20260304_mvp_condos_roles_docs_templates.sql each contain
-- `SELECT FROM public.users` inside a policy *on* public.users, which Postgres
-- evaluates by re-applying the same policy → infinite recursion (error 42P17).
--
-- The canonical Supabase fix is to put the lookup behind a SECURITY DEFINER
-- helper function, which bypasses RLS for its own internal query but only
-- exposes a boolean answer to the caller — so we don't leak rows, we just
-- answer "is the current user a gestor in this empresa?".
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_is_company_manager(target_empresa text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id_user::text = auth.uid()::text
      AND role = 'gestor'
      AND empresa IS NOT DISTINCT FROM target_empresa
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_company_manager(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_company_manager(text) TO authenticated;

-- Rewrite the two recursive policies to use the helper.

DROP POLICY IF EXISTS "users_select_company_if_manager" ON public.users;
CREATE POLICY "users_select_company_if_manager"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.current_user_is_company_manager(empresa));

DROP POLICY IF EXISTS "users_update_company_if_manager" ON public.users;
CREATE POLICY "users_update_company_if_manager"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.current_user_is_company_manager(empresa))
  WITH CHECK (public.current_user_is_company_manager(empresa));
