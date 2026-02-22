import { supabase } from '@/supabase-client';

export type CategoriaOcorrencia = 'estrutural' | 'canalização' | 'eletricidade' | 'elevador' | 'zona_comum' | 'seguranca_incendio' | 'outro';
export type ResponsabilidadeOcorrencia = 'condominio' | 'fracao';
export type PrioridadeOcorrencia = 'critica' | 'alta' | 'media' | 'baixa';
export type EstadoOcorrencia = 'reportada' | 'triagem' | 'em_progresso' | 'resolvida' | 'fechada';

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
};
