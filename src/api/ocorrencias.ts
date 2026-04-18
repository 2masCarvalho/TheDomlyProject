import { supabase } from '@/supabase-client';

export type CategoriaOcorrencia = 'estrutural' | 'canalização' | 'eletricidade' | 'elevador' | 'zona_comum' | 'seguranca_incendio' | 'outro';
export type ResponsabilidadeOcorrencia = 'condominio' | 'fracao';
export type PrioridadeOcorrencia = 'critica' | 'alta' | 'media' | 'baixa';
export type EstadoOcorrencia = 'reportada' | 'triagem' | 'em_progresso' | 'resolvida' | 'fechada';

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
}

export const ocorrenciasApi = {
  getAll: async (): Promise<Ocorrencia[]> => {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getByCondominio: async (condominioId: number): Promise<Ocorrencia[]> => {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('id_condominio', condominioId)
      .order('prioridade', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
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

  update: async (id: number, data: Partial<Ocorrencia>): Promise<Ocorrencia> => {
    const payload = { ...data };
    if (payload.estado === 'resolvida' && !payload.resolved_at) {
      (payload as any).resolved_at = new Date().toISOString();
    }
    const { data: result, error } = await supabase
      .from('ocorrencias')
      .update(payload)
      .eq('id_ocorrencia', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('ocorrencias')
      .delete()
      .eq('id_ocorrencia', id);
    if (error) throw error;
  },

  linkToTrabalho: async (id: number, trabalhoId: number): Promise<Ocorrencia> => {
    const { data, error } = await supabase
      .from('ocorrencias')
      .update({ id_trabalho_manutencao: trabalhoId })
      .eq('id_ocorrencia', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Photo upload ────────────────────────────────────────────────

  uploadPhoto: async (condominioId: number, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `condominios/${condominioId}/${fileName}`;

    const { error } = await supabase.storage
      .from(FOTOS_BUCKET)
      .upload(filePath, file, { upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  },

  uploadPhotos: async (condominioId: number, files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const url = await ocorrenciasApi.uploadPhoto(condominioId, file);
      urls.push(url);
    }
    return urls;
  },

  getPhotoSignedUrl: async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(FOTOS_BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
};