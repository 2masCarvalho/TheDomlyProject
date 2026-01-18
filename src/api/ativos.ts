import { supabase } from '@/supabase-client';

export interface Notificacao {
  id: number;
  tipo: 'info' | 'aviso' | 'urgente';
  titulo: string;
  mensagem: string;
  data: string;
  data_criacao: string;
  lida: boolean;
}

export interface Manutencao {
  id: number;
  data: string;
  descricao: string;
  custo?: number;
  responsavel?: string;
}

export interface Documento {
  id: number;
  nome: string;
  tipo: string;
  url: string;
  data_upload: string;
}

export interface Foto {
  id: number;
  url: string;
  data_upload: string;
}

export interface Ativo {
  id_ativo: number;
  id_condominio: number;
  nome: string;
  categoria: string;
  marca?: string;
  modelo?: string;
  num_serie?: number;
  data_instalacao?: string;
  created_at?: string;

  // Fields not in DB yet but used in UI (keeping optional for now or need to be added to DB)
  estado?: 'excelente' | 'bom' | 'regular' | 'mau';
  descricao?: string;
  valor?: number;
  data_proxima_manutencao?: string;
  localizacao?: string;
  observacoes?: string;

  notificacoes?: Notificacao[];
  manutencoes?: Manutencao[];
  documentos?: Documento[];
  fotos?: string[];
}

export interface CreateAtivoData {
  id_condominio: number;
  nome: string;
  categoria: string;
  marca?: string;
  modelo?: string;
  num_serie?: number;
  data_instalacao?: string;

  // Keeping these for compatibility if we add them later
  estado?: 'excelente' | 'bom' | 'regular' | 'mau';
  descricao?: string;
  valor?: number;
  localizacao?: string;
}

export const ativosApi = {
  getByCondominio: async (condominioId: number): Promise<Ativo[]> => {
    const { data, error } = await supabase
      .from('ativos')
      .select('*')
      .eq('id_condominio', condominioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<Ativo | null> => {
    const { data, error } = await supabase
      .from('ativos')
      .select('*')
      .eq('id_ativo', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (data: CreateAtivoData): Promise<Ativo> => {
    // Filter out undefined values to avoid sending them to Supabase if columns don't exist
    const payload = {
      id_condominio: data.id_condominio,
      nome: data.nome,
      categoria: data.categoria,
      marca: data.marca,
      modelo: data.modelo,
      num_serie: (data.num_serie !== undefined && !Number.isNaN(data.num_serie)) ? data.num_serie : null,
      data_instalacao: data.data_instalacao || null,
      estado: data.estado,
      descricao: data.descricao,
      valor: (data.valor !== undefined && !Number.isNaN(data.valor)) ? data.valor : null,
      localizacao: data.localizacao,
    };

    console.log('Sending payload to Supabase:', payload);

    const { data: newAtivo, error } = await supabase
      .from('ativos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating ativo:', error);
      throw error;
    }
    return newAtivo;
  },

  update: async (id: number, data: Partial<CreateAtivoData>): Promise<Ativo> => {
    const payload = { ...data };
    if (payload.data_instalacao === '') {
      (payload as any).data_instalacao = null;
    }
    if (payload.num_serie !== undefined && Number.isNaN(payload.num_serie)) {
      (payload as any).num_serie = null;
    }
    if (payload.valor !== undefined && Number.isNaN(payload.valor)) {
      (payload as any).valor = null;
    }

    const { data: updatedAtivo, error } = await supabase
      .from('ativos')
      .update(payload)
      .eq('id_ativo', id)
      .select()
      .single();

    if (error) throw error;
    return updatedAtivo;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('ativos')
      .delete()
      .eq('id_ativo', id);

    if (error) throw error;
  },
};

