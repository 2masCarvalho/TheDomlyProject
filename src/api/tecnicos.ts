import { supabase } from '@/supabase-client';

export type DisponibilidadeTecnico = 'disponivel' | 'ocupado' | 'indisponivel';
export type EspecialidadeTecnico = 'canalização' | 'eletricidade' | 'serralharia' | 'pintura' | 'avac' | 'geral';

export interface Tecnico {
  id_tecnico: number;
  nome: string;
  email?: string;
  telefone?: string;
  especialidades: string[];
  estado_disponibilidade: DisponibilidadeTecnico;
  avaliacao_media: number;
  total_trabalhos_concluidos: number;
  zona?: string;
  created_at: string;
}

export interface CreateTecnicoData {
  nome: string;
  email?: string;
  telefone?: string;
  especialidades?: string[];
  estado_disponibilidade?: DisponibilidadeTecnico;
  zona?: string;
}

export const tecnicosApi = {
  getAll: async (): Promise<Tecnico[]> => {
    const { data, error } = await supabase
      .from('tecnicos')
      .select('*')
      .order('avaliacao_media', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getAvailableBySpecialty: async (especialidade: string): Promise<Tecnico[]> => {
    const { data, error } = await supabase
      .from('tecnicos')
      .select('*')
      .eq('estado_disponibilidade', 'disponivel')
      .contains('especialidades', [especialidade])
      .order('avaliacao_media', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<Tecnico | null> => {
    const { data, error } = await supabase
      .from('tecnicos')
      .select('*')
      .eq('id_tecnico', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (data: CreateTecnicoData): Promise<Tecnico> => {
    const { data: result, error } = await supabase
      .from('tecnicos')
      .insert([{ ...data, avaliacao_media: 0, total_trabalhos_concluidos: 0 }])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  update: async (id: number, data: Partial<CreateTecnicoData>): Promise<Tecnico> => {
    const { data: result, error } = await supabase
      .from('tecnicos')
      .update(data)
      .eq('id_tecnico', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('tecnicos')
      .delete()
      .eq('id_tecnico', id);
    if (error) throw error;
  },
};
