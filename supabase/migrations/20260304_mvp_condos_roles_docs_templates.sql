-- MVP: Condominios (soft delete), global roles, condo documents, and document templates

-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1) Condominios: soft-delete flag
-- ------------------------------------------------------------
ALTER TABLE condominios
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ------------------------------------------------------------
-- 2) Global roles on public.users (custom profile table used by app)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('gestor', 'residente', 'tecnico');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    EXECUTE 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT ''gestor''';
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Policies (id_user is stored as text uuid in this project)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  TO authenticated
  USING (id_user::text = auth.uid()::text);

DROP POLICY IF EXISTS "users_select_company_if_manager" ON public.users;
CREATE POLICY "users_select_company_if_manager"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users me
      WHERE me.id_user::text = auth.uid()::text
        AND me.role = 'gestor'
        AND me.empresa = public.users.empresa
    )
  );

DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id_user::text = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id_user::text = auth.uid()::text)
  WITH CHECK (id_user::text = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_company_if_manager" ON public.users;
CREATE POLICY "users_update_company_if_manager"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users me
      WHERE me.id_user::text = auth.uid()::text
        AND me.role = 'gestor'
        AND me.empresa = public.users.empresa
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users me
      WHERE me.id_user::text = auth.uid()::text
        AND me.role = 'gestor'
        AND me.empresa = public.users.empresa
    )
  );

-- ------------------------------------------------------------
-- 3) Documentos (shared table for ativo + condominio documents)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS documentos (
  id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_condominio BIGINT REFERENCES condominios(id_comdominio) ON DELETE CASCADE,
  id_ativo BIGINT REFERENCES ativos(id_ativo) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  categoria TEXT,
  url TEXT NOT NULL,
  data_emissao DATE,
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Only allow access to documents belonging to condominios owned by the user.
-- (MVP assumption: condo ownership == access)
DROP POLICY IF EXISTS "documentos_select_owner" ON documentos;
CREATE POLICY "documentos_select_owner"
  ON documentos FOR SELECT
  TO authenticated
  USING (
    id_condominio IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = documentos.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "documentos_insert_owner" ON documentos;
CREATE POLICY "documentos_insert_owner"
  ON documentos FOR INSERT
  TO authenticated
  WITH CHECK (
    id_condominio IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = documentos.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "documentos_update_owner" ON documentos;
CREATE POLICY "documentos_update_owner"
  ON documentos FOR UPDATE
  TO authenticated
  USING (
    id_condominio IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = documentos.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  )
  WITH CHECK (
    id_condominio IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = documentos.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "documentos_delete_owner" ON documentos;
CREATE POLICY "documentos_delete_owner"
  ON documentos FOR DELETE
  TO authenticated
  USING (
    id_condominio IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = documentos.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP TRIGGER IF EXISTS update_documentos_updated_at ON documentos;
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ------------------------------------------------------------
-- 4) Storage bucket for condo documents
--   path convention: condominios/<condominioId>/<filename>
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('condominio-documents', 'condominio-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "condominio_docs_select_owner" ON storage.objects;
CREATE POLICY "condominio_docs_select_owner"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'condominio-documents'
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio::text = split_part(name, '/', 2)
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "condominio_docs_insert_owner" ON storage.objects;
CREATE POLICY "condominio_docs_insert_owner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'condominio-documents'
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio::text = split_part(name, '/', 2)
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "condominio_docs_update_owner" ON storage.objects;
CREATE POLICY "condominio_docs_update_owner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'condominio-documents'
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio::text = split_part(name, '/', 2)
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "condominio_docs_delete_owner" ON storage.objects;
CREATE POLICY "condominio_docs_delete_owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'condominio-documents'
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio::text = split_part(name, '/', 2)
        AND c.id_user::text = auth.uid()::text
    )
  );

-- ------------------------------------------------------------
-- 5) Document templates (PDF generation)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  template_type TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Select templates within the same company
DROP POLICY IF EXISTS "templates_select_company" ON document_templates;
CREATE POLICY "templates_select_company"
  ON document_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users me
      JOIN public.users owner ON owner.id_user::text = document_templates.created_by::text
      WHERE me.id_user::text = auth.uid()::text
        AND me.empresa = owner.empresa
    )
  );

-- Only gestores can create templates
DROP POLICY IF EXISTS "templates_insert_manager" ON document_templates;
CREATE POLICY "templates_insert_manager"
  ON document_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.id_user::text = auth.uid()::text
        AND me.role = 'gestor'
    )
  );

-- Gestores can update/delete templates within their company
DROP POLICY IF EXISTS "templates_update_manager_company" ON document_templates;
CREATE POLICY "templates_update_manager_company"
  ON document_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users me
      JOIN public.users owner ON owner.id_user::text = document_templates.created_by::text
      WHERE me.id_user::text = auth.uid()::text
        AND me.role = 'gestor'
        AND me.empresa = owner.empresa
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users me
      JOIN public.users owner ON owner.id_user::text = document_templates.created_by::text
      WHERE me.id_user::text = auth.uid()::text
        AND me.role = 'gestor'
        AND me.empresa = owner.empresa
    )
  );

DROP POLICY IF EXISTS "templates_delete_manager_company" ON document_templates;
CREATE POLICY "templates_delete_manager_company"
  ON document_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users me
      JOIN public.users owner ON owner.id_user::text = document_templates.created_by::text
      WHERE me.id_user::text = auth.uid()::text
        AND me.role = 'gestor'
        AND me.empresa = owner.empresa
    )
  );

DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

