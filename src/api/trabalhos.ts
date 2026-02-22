import { supabase } from '@/supabase-client';

export type CategoriaTrabalho = 'canalização' | 'eletricidade' | 'serralharia' | 'pintura' | 'avac' | 'geral';
export type UrgenciaTrabalho = 'critica' | 'alta' | 'media' | 'baixa';
export type EstadoTrabalho = 'aberto' | 'atribuido' | 'em_progresso' | 'concluido' | 'cancelado';

export interface Trabalho {
  id_trabalho: number;
  id_condominio: number;
  titulo: string;
  descricao?: string;
  categoria: CategoriaTrabalho;
  urgencia: UrgenciaTrabalho;
  estado: EstadoTrabalho;
  created_by?: string;
  id_tecnico_atribuido?: number;
  id_ocorrencia?: number;
  token_tecnico?: string;
  is_urgente?: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TrabalhoPublico {
  id_trabalho: number;
  titulo: string;
  descricao?: string;
  categoria: string;
  urgencia: string;
  estado: string;
  is_urgente: boolean;
  token_tecnico: string;
  created_at: string;
  condominio_nome?: string;
}

export interface Candidatura {
  id_candidatura: number;
  id_trabalho: number;
  id_tecnico: number;
  preco_proposto?: number;
  mensagem?: string;
  estado: 'pendente' | 'aceite' | 'rejeitado';
  created_at: string;
}

export interface CreateTrabalhoData {
  id_condominio: number;
  titulo: string;
  descricao?: string;
  categoria: CategoriaTrabalho;
  urgencia: UrgenciaTrabalho;
  id_ocorrencia?: number;
}

export const trabalhosApi = {
  getAll: async (): Promise<Trabalho[]> => {
    const { data, error } = await supabase
      .from('trabalhos_manutencao')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<Trabalho | null> => {
    const { data, error } = await supabase
      .from('trabalhos_manutencao')
      .select('*')
      .eq('id_trabalho', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (data: CreateTrabalhoData): Promise<Trabalho> => {
    const { data: result, error } = await supabase
      .from('trabalhos_manutencao')
      .insert([{ ...data, estado: 'aberto' }])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  update: async (id: number, data: Partial<Trabalho>): Promise<Trabalho> => {
    const payload = { ...data };
    if (payload.estado === 'concluido' && !payload.completed_at) {
      (payload as any).completed_at = new Date().toISOString();
    }
    const { data: result, error } = await supabase
      .from('trabalhos_manutencao')
      .update(payload)
      .eq('id_trabalho', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('trabalhos_manutencao')
      .delete()
      .eq('id_trabalho', id);
    if (error) throw error;
  },

  assignTecnico: async (trabalhoId: number, tecnicoId: number): Promise<Trabalho> => {
    const { data, error } = await supabase
      .from('trabalhos_manutencao')
      .update({ id_tecnico_atribuido: tecnicoId, estado: 'atribuido' })
      .eq('id_trabalho', trabalhoId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getCandidaturas: async (trabalhoId: number): Promise<Candidatura[]> => {
    const { data, error } = await supabase
      .from('candidaturas_trabalho')
      .select('*')
      .eq('id_trabalho', trabalhoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createCandidatura: async (candidatura: {
    id_trabalho: number;
    id_tecnico: number;
    preco_proposto?: number;
    mensagem?: string;
  }): Promise<Candidatura> => {
    const { data, error } = await supabase
      .from('candidaturas_trabalho')
      .insert([{ ...candidatura, estado: 'pendente' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCandidatura: async (id: number, estado: 'aceite' | 'rejeitado'): Promise<Candidatura> => {
    const { data, error } = await supabase
      .from('candidaturas_trabalho')
      .update({ estado })
      .eq('id_candidatura', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Manager: mark that the assigned technician called to cancel
  marcarCancelamentoPorTecnico: async (trabalhoId: number): Promise<Trabalho> => {
    const { data, error } = await supabase
      .from('trabalhos_manutencao')
      .update({ estado: 'aberto', id_tecnico_atribuido: null, is_urgente: true })
      .eq('id_trabalho', trabalhoId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Public (no auth): get job details by token for technician page
  getPublico: async (token: string): Promise<TrabalhoPublico | null> => {
    const { data, error } = await supabase.rpc('get_trabalho_por_token', { p_token: token });
    if (error) throw error;
    return data as TrabalhoPublico | null;
  },

  // Public (no auth): technician accepts or cancels via token
  responderPublico: async (token: string, aceitar: boolean): Promise<void> => {
    const { error } = await supabase.rpc('responder_trabalho_por_token', {
      p_token: token,
      p_aceitar: aceitar,
    });
    if (error) throw error;
  },
};
