-- Fix RLS on condominios: split into explicit per-operation policies
-- to avoid any ambiguity with the FOR ALL + USING + WITH CHECK combination.

ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

-- Drop the old combined policy if it exists
DROP POLICY IF EXISTS "condominios_owner_all" ON public.condominios;
DROP POLICY IF EXISTS "condominios_member_select" ON public.condominios;

-- SELECT: owner sees their own rows
DROP POLICY IF EXISTS "condominios_select_owner" ON public.condominios;
CREATE POLICY "condominios_select_owner" ON public.condominios
  FOR SELECT TO authenticated
  USING (id_user = auth.uid());

-- SELECT: member can read condominios they are linked to
DROP POLICY IF EXISTS "condominios_select_member" ON public.condominios;
CREATE POLICY "condominios_select_member" ON public.condominios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.condominio_memberships m
      WHERE m.id_condominio = condominios.id_comdominio
        AND m.id_user::text = auth.uid()::text
    )
  );

-- INSERT: owner can create condominios for themselves
DROP POLICY IF EXISTS "condominios_insert_owner" ON public.condominios;
CREATE POLICY "condominios_insert_owner" ON public.condominios
  FOR INSERT TO authenticated
  WITH CHECK (id_user = auth.uid());

-- UPDATE: owner can update their own condominios
DROP POLICY IF EXISTS "condominios_update_owner" ON public.condominios;
CREATE POLICY "condominios_update_owner" ON public.condominios
  FOR UPDATE TO authenticated
  USING (id_user = auth.uid())
  WITH CHECK (id_user = auth.uid());

-- DELETE: owner can delete their own condominios
DROP POLICY IF EXISTS "condominios_delete_owner" ON public.condominios;
CREATE POLICY "condominios_delete_owner" ON public.condominios
  FOR DELETE TO authenticated
  USING (id_user = auth.uid());
