-- Allow members (via condominio_memberships) to SELECT condominios they belong to.
-- Owners are already covered by the app-level filter; this policy makes the row
-- readable for residents and technicians who join via invite link.

ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
DROP POLICY IF EXISTS "condominios_owner_all" ON public.condominios;
CREATE POLICY "condominios_owner_all" ON public.condominios
  FOR ALL TO authenticated
  USING (id_user::text = auth.uid()::text)
  WITH CHECK (id_user::text = auth.uid()::text);

-- Members (residents / technicians) can read the condominios they are linked to
DROP POLICY IF EXISTS "condominios_member_select" ON public.condominios;
CREATE POLICY "condominios_member_select" ON public.condominios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.condominio_memberships m
      WHERE m.id_condominio = condominios.id_comdominio
        AND m.id_user::text = auth.uid()::text
    )
  );
