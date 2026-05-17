import { supabase } from '../supabase';

export type CategoriaOcorrencia =
  | 'estrutural'
  | 'canalização'
  | 'eletricidade'
  | 'elevador'
  | 'zona_comum'
  | 'seguranca_incendio'
  | 'outro';

export type ResponsabilidadeOcorrencia = 'condominio' | 'fracao';
export type PrioridadeOcorrencia = 'critica' | 'alta' | 'media' | 'baixa';
export type EstadoOcorrencia =
  | 'reportada'
  | 'triagem'
  | 'em_progresso'
  | 'resolvida'
  | 'fechada';

const FOTOS_BUCKET = 'ocorrencia-fotos';

export interface Ocorrencia {
  id_ocorrencia: number;
  id_condominio: number;
  titulo: string;
  descricao?: string;
  categoria: CategoriaOcorrencia;
  responsabilidade: ResponsabilidadeOcorrencia;
  prioridade: PrioridadeOcorrencia;
  estado: EstadoOcorrencia;
  reportado_por?: string;
  id_trabalho_manutencao?: number;
  notas?: string;
  foto_urls?: string[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface CreateOcorrenciaData {
  id_condominio: number;
  titulo: string;
  descricao?: string;
  categoria: CategoriaOcorrencia;
  responsabilidade: ResponsabilidadeOcorrencia;
  prioridade: PrioridadeOcorrencia;
  reportado_por?: string;
  notas?: string;
  foto_urls?: string[];
  created_by?: string;
}

export const ocorrenciasApi = {
  /** Reports authored by the current user, newest first. RLS already scopes by membership. */
  getMine: async (): Promise<Ocorrencia[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  getById: async (id: number): Promise<Ocorrencia | null> => {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('id_ocorrencia', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (data: CreateOcorrenciaData): Promise<Ocorrencia> => {
    const { data: result, error } = await supabase
      .from('ocorrencias')
      .insert([{ ...data, estado: 'reportada' }])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  /**
   * React Native photo upload — Supabase JS cannot consume a File on RN, so we
   * pass FormData built from the picker URI. Matches the web bucket + path
   * convention so photos appear in the gestor's existing UI unchanged.
   */
  uploadPhoto: async (condominioId: number, uri: string): Promise<string> => {
    const rawExt = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `condominios/${condominioId}/${fileName}`;
    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const formData = new FormData();
    // RN's FormData accepts this shape; cast through any because @types lib doesn't know.
    formData.append('file', { uri, name: fileName, type: contentType } as any);

    const { error } = await supabase.storage
      .from(FOTOS_BUCKET)
      .upload(filePath, formData as any, {
        upsert: false,
        contentType: 'multipart/form-data',
      });
    if (error) throw error;

    const { data } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  },

  uploadPhotos: async (
    condominioId: number,
    uris: string[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < uris.length; i++) {
      const url = await ocorrenciasApi.uploadPhoto(condominioId, uris[i]);
      urls.push(url);
      onProgress?.(i + 1, uris.length);
    }
    return urls;
  },
};
