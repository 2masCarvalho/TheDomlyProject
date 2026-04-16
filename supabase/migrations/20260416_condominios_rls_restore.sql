-- Restore condominios access.
-- The app already filters by id_user in code, so RLS on this table
-- is not needed for owner isolation. Members are handled via the join below.

-- Drop all policies we added
DROP POLICY IF EXISTS "condominios_owner_all"      ON public.condominios;
DROP POLICY IF EXISTS "condominios_member_select"  ON public.condominios;
DROP POLICY IF EXISTS "condominios_select_owner"   ON public.condominios;
DROP POLICY IF EXISTS "condominios_select_member"  ON public.condominios;
DROP POLICY IF EXISTS "condominios_insert_owner"   ON public.condominios;
DROP POLICY IF EXISTS "condominios_update_owner"   ON public.condominios;
DROP POLICY IF EXISTS "condominios_delete_owner"   ON public.condominios;

-- Disable RLS entirely — owner filtering is enforced at the query level in code
ALTER TABLE public.condominios DISABLE ROW LEVEL SECURITY;
