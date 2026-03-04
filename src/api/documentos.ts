import { supabase } from '@/supabase-client';

export type Documento = {
  id_documento: string;
  id_condominio: number;
  nome: string;
  tipo_documento: string;
  categoria?: string | null;
  url: string; // storage path (bucket: condominio-documents)
  data_upload?: string | null;
  created_at?: string;
};

export type CreateDocumentoData = {
  id_condominio: number;
  nome: string;
  tipo_documento: string;
  categoria?: string | null;
  url: string; // storage path
};

const BUCKET_ID = 'condominio-documents';

export const documentosApi = {
  listByCondominio: async (id_condominio: number): Promise<Documento[]> => {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('id_condominio', id_condominio)
      .order('data_upload', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Documento[];
  },

  uploadCondominioDocumento: async (condominioId: number, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `condominios/${condominioId}/${fileName}`;

    const { error } = await supabase.storage.from(BUCKET_ID).upload(filePath, file, {
      upsert: false,
    });
    if (error) throw error;
    return filePath;
  },

  create: async (payload: CreateDocumentoData): Promise<Documento> => {
    const { data, error } = await supabase.from('documentos').insert([payload]).select().single();
    if (error) throw error;
    return data as Documento;
  },

  getSignedDownloadUrl: async (storagePath: string, expiresInSeconds = 60): Promise<string> => {
    const { data, error } = await supabase.storage.from(BUCKET_ID).createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },
};

