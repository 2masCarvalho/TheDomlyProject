-- Create enums
CREATE TYPE public.area_empresa AS ENUM ('Eletricidade', 'Canalizacao', 'AVAC', 'Elevadores', 'Seguranca', 'Limpeza', 'Jardinagem', 'Outra');
CREATE TYPE public.tipo_manutencao AS ENUM ('Preventiva', 'Corretiva', 'Inspeção');
CREATE TYPE public.estado_manutencao AS ENUM ('Agendada', 'Concluída', 'Cancelada');
CREATE TYPE public.tipo_alerta AS ENUM ('Manutencao', 'Garantia', 'Inspeção', 'Avaria', 'Outro');
CREATE TYPE public.estado_alerta AS ENUM ('Ativo', 'Resolvido', 'Ignorado');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create empresa table
CREATE TABLE public.empresa (
  id_empresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  area area_empresa NOT NULL,
  contacto TEXT NOT NULL,
  email TEXT,
  morada TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create condominio table
CREATE TABLE public.condominio (
  id_condominio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  morada TEXT NOT NULL,
  cidade TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  nif INTEGER NOT NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ativo table
CREATE TABLE public.ativo (
  id_ativo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_condominio UUID NOT NULL REFERENCES public.condominio(id_condominio) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  num_serie TEXT,
  data_instalacao DATE,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create documento table
CREATE TABLE public.documento (
  id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ativo UUID REFERENCES public.ativo(id_ativo) ON DELETE CASCADE,
  id_condominio UUID REFERENCES public.condominio(id_condominio) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  url TEXT NOT NULL,
  data_emissao DATE,
  data_upload TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documento_reference_check CHECK (
    (id_ativo IS NOT NULL AND id_condominio IS NULL) OR 
    (id_ativo IS NULL AND id_condominio IS NOT NULL)
  )
);

-- Create alerta table
CREATE TABLE public.alerta (
  id_alerta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ativo UUID NOT NULL REFERENCES public.ativo(id_ativo) ON DELETE CASCADE,
  tipo_alerta tipo_alerta NOT NULL,
  mensagem TEXT,
  data_alerta TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado estado_alerta NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create manutencao table
CREATE TABLE public.manutencao (
  id_manutencao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ativo UUID NOT NULL REFERENCES public.ativo(id_ativo) ON DELETE CASCADE,
  id_empresa UUID NOT NULL REFERENCES public.empresa(id_empresa) ON DELETE RESTRICT,
  tipo_manutencao tipo_manutencao NOT NULL,
  descricao TEXT NOT NULL,
  data_agendada DATE NOT NULL,
  data_conclusao DATE,
  estado estado_manutencao NOT NULL DEFAULT 'Agendada',
  custo DECIMAL(10,2),
  proxima_manutencao_prevista DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_condominio_user ON public.condominio(id_user);
CREATE INDEX idx_ativo_condominio ON public.ativo(id_condominio);
CREATE INDEX idx_documento_ativo ON public.documento(id_ativo);
CREATE INDEX idx_documento_condominio ON public.documento(id_condominio);
CREATE INDEX idx_alerta_ativo ON public.alerta(id_ativo);
CREATE INDEX idx_manutencao_ativo ON public.manutencao(id_ativo);
CREATE INDEX idx_manutencao_empresa ON public.manutencao(id_empresa);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencao ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for empresa (public read, authenticated insert/update)
CREATE POLICY "Everyone can view empresas"
  ON public.empresa FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert empresas"
  ON public.empresa FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update empresas"
  ON public.empresa FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for condominio
CREATE POLICY "Users can view their own condominios"
  ON public.condominio FOR SELECT
  USING (auth.uid() = id_user);

CREATE POLICY "Users can insert their own condominios"
  ON public.condominio FOR INSERT
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update their own condominios"
  ON public.condominio FOR UPDATE
  USING (auth.uid() = id_user);

CREATE POLICY "Users can delete their own condominios"
  ON public.condominio FOR DELETE
  USING (auth.uid() = id_user);

-- RLS Policies for ativo
CREATE POLICY "Users can view ativos from their condominios"
  ON public.ativo FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = ativo.id_condominio
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can insert ativos to their condominios"
  ON public.ativo FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = ativo.id_condominio
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can update ativos from their condominios"
  ON public.ativo FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = ativo.id_condominio
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can delete ativos from their condominios"
  ON public.ativo FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = ativo.id_condominio
      AND condominio.id_user = auth.uid()
    )
  );

-- RLS Policies for documento
CREATE POLICY "Users can view documentos from their condominios/ativos"
  ON public.documento FOR SELECT
  USING (
    (id_condominio IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = documento.id_condominio
      AND condominio.id_user = auth.uid()
    ))
    OR
    (id_ativo IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = documento.id_ativo
      AND condominio.id_user = auth.uid()
    ))
  );

CREATE POLICY "Users can insert documentos to their condominios/ativos"
  ON public.documento FOR INSERT
  WITH CHECK (
    (id_condominio IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = documento.id_condominio
      AND condominio.id_user = auth.uid()
    ))
    OR
    (id_ativo IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = documento.id_ativo
      AND condominio.id_user = auth.uid()
    ))
  );

CREATE POLICY "Users can update documentos from their condominios/ativos"
  ON public.documento FOR UPDATE
  USING (
    (id_condominio IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = documento.id_condominio
      AND condominio.id_user = auth.uid()
    ))
    OR
    (id_ativo IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = documento.id_ativo
      AND condominio.id_user = auth.uid()
    ))
  );

CREATE POLICY "Users can delete documentos from their condominios/ativos"
  ON public.documento FOR DELETE
  USING (
    (id_condominio IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.condominio
      WHERE condominio.id_condominio = documento.id_condominio
      AND condominio.id_user = auth.uid()
    ))
    OR
    (id_ativo IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = documento.id_ativo
      AND condominio.id_user = auth.uid()
    ))
  );

-- RLS Policies for alerta
CREATE POLICY "Users can view alertas from their ativos"
  ON public.alerta FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = alerta.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can insert alertas to their ativos"
  ON public.alerta FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = alerta.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can update alertas from their ativos"
  ON public.alerta FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = alerta.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can delete alertas from their ativos"
  ON public.alerta FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = alerta.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

-- RLS Policies for manutencao
CREATE POLICY "Users can view manutencoes from their ativos"
  ON public.manutencao FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = manutencao.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can insert manutencoes to their ativos"
  ON public.manutencao FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = manutencao.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can update manutencoes from their ativos"
  ON public.manutencao FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = manutencao.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

CREATE POLICY "Users can delete manutencoes from their ativos"
  ON public.manutencao FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ativo
      JOIN public.condominio ON condominio.id_condominio = ativo.id_condominio
      WHERE ativo.id_ativo = manutencao.id_ativo
      AND condominio.id_user = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.empresa
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.condominio
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ativo
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.documento
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.alerta
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.manutencao
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, empresa)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'empresa'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();