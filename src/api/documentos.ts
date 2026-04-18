import { supabase } from '@/supabase-client';

export type EstadoProcessamento = 'pendente' | 'a_processar' | 'concluido' | 'erro';

export type Documento = {
  id_documento: number;
  id_condominio: number;
  nome: string;
  tipo_documento: string;
  categoria?: string | null;
  url: string;
  data_upload?: string | null;
  created_at?: string;
  // AI extraction fields
  estado_processamento?: EstadoProcessamento;
  dados_extraidos?: any | null;
  data_expiracao?: string | null;
  data_inicio?: string | null;
  valor_monetario?: number | null;
  entidade?: string | null;
  resumo?: string | null;
  processado_em?: string | null;
};

export type CreateDocumentoData = {
  id_condominio: number;
  nome: string;
  tipo_documento: string;
  categoria?: string | null;
  url: string;
  estado_processamento?: EstadoProcessamento;
};

const BUCKET_ID = 'condominio-documents';

console.log('[upload] update payload:', {
  tipo_documento: extraction.tipo_documento || 'outro',
  categoria: extraction.categoria || 'outro',
  resumo: extraction.resumo,
  data_expiracao: extraction.data_expiracao,
  data_inicio: extraction.data_inicio,
  valor_monetario: extraction.valor_monetario,
  entidade: extraction.entidade,
  dados_extraidos: extraction,
  estado_processamento: 'concluido',
  processado_em: new Date().toISOString(),
});

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

  update: async (id: number, payload: Partial<Documento>): Promise<Documento> => {
    const { data, error } = await supabase
      .from('documentos')
      .update(payload)
      .eq('id_documento', id)
      .select()
      .single();
    if (error) throw error;
    return data as Documento;
  },

  getSignedDownloadUrl: async (storagePath: string, expiresInSeconds = 60): Promise<string> => {
    const { data, error } = await supabase.storage.from(BUCKET_ID).createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },
};