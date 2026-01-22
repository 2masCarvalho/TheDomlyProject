import { supabase } from '@/supabase-client';

export interface Alerta {
  id_alerta: number;
  id_ativo: number;
  tipo_alerta: 'avaria' | 'manutencao' | 'limpeza' | 'inspecao' | 'outro';
  titulo: string;
  mensagem: string;
  estado: 'pendente' | 'resolvido';
  data_alerta: string;
}

export interface Foto {
  id: number;
  url: string;
  created_at: string;
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
  tipo_documento: string;
  url: string;
  data_upload: string;
  created_at?: string;
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
  estado: 'excelente' | 'bom' | 'regular' | 'mau';
  descricao?: string;
  valor?: number;
  data_proxima_manutencao?: string;
  ultima_manutencao?: string;
  frequencia_manutencao?: number;
  localizacao?: string;
  observacoes?: string;
  alertas?: Alerta[];       // Adiciona isto para resolver o erro da image_1f5583
  fotos?: Foto[];
  documentos?: Documento[];
}

export interface CreateAtivoData {
  id_condominio: number;
  nome: string;
  categoria: string;
  marca?: string;
  modelo?: string;
  num_serie?: number;
  data_instalacao?: string;
  estado?: 'excelente' | 'bom' | 'regular' | 'mau';
  descricao?: string;
  valor?: number;
  localizacao?: string;
  ultima_manutencao?: string;
  frequencia_manutencao?: number;
}

export const manutencoesApi = {
  createMaintenance: async (data: any) => {
  const { data: result, error } = await supabase
    .from('manutencoes')
    .insert([{
      id_ativo: data.id_ativo,
      descricao: data.descricao,
      data_conclusao: data.data_conclusao,
      custo: data.custo,
      estado: data.estado,
      tipo_manutencao: data.tipo_manutencao // Campo adicionado para resolver image_c73a4e.jpg
    }])
    .select()
    .single();

  if (error) throw error;
  return result;
},

  getAllMaintenances: async () => {
  const { data, error } = await supabase
    .from('manutencoes')
    // Nota as relações: puxamos ativos e, dentro de ativos, os condominios
    .select('*, ativos(nome, id_condominio, condominios(nome))')
    .order('data_conclusao', { ascending: false });

  if (error) throw error;
  return data;
},

updateMaintenance: async (id: number, data: any) => {
  const { data: result, error } = await supabase
    .from('manutencoes')
    .update({
      descricao: data.descricao,
      data_conclusao: data.data_conclusao,
      custo: data.custo,
      estado: data.estado,
      tipo_manutencao: data.tipo_manutencao,
      id_ativo: data.id_ativo
    })
    .eq('id_manutencao', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}


};


export const ativosApi = {
  getAll: async (): Promise<Ativo[]> => {
  const { data, error } = await supabase
    .from('ativos')
    // ADICIONA fotos(*) AQUI TAMBÉM:
    .select('*, documentos(*), fotos(*)') 
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
},

  getAllAlerts: async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('alertas')
    .select(`
      *,
      ativos (
        nome,
        id_ativo,
        id_condominio,
        condominios (
          nome
        )
      )
    `)
    .order('data_alerta', { ascending: false });

  if (error) throw error;
  return data || [];
},

  getByCondominio: async (condominioId: number): Promise<Ativo[]> => {
    const { data, error } = await supabase
      .from('ativos')
      .select('*, documentos(*), fotos(*)') 
      .eq('id_condominio', condominioId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<Ativo | null> => {
    const { data, error } = await supabase
      .from('ativos')
      .select('*, documentos(*), fotos(*), alertas(*)') // ADICIONADO alertas(*)
      .eq('id_ativo', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (data: CreateAtivoData): Promise<Ativo> => {
    const payload = {
      id_condominio: data.id_condominio,
      nome: data.nome,
      categoria: data.categoria,
      marca: data.marca,
      modelo: data.modelo,
      num_serie: (data.num_serie !== undefined && !Number.isNaN(data.num_serie)) ? data.num_serie : null,
      data_instalacao: data.data_instalacao || null,
      ultima_manutencao: data.ultima_manutencao || null,
      frequencia_manutencao: data.frequencia_manutencao || 6,
      estado: data.estado,
      descricao: data.descricao,
      valor: (data.valor !== undefined && !Number.isNaN(data.valor)) ? data.valor : null,
      localizacao: data.localizacao,
    };

    const { data: newAtivo, error } = await supabase
      .from('ativos')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return newAtivo;
  },

  

  update: async (id: number, data: Partial<CreateAtivoData>): Promise<Ativo> => {
    const payload = { ...data };
    if (payload.data_instalacao === '') (payload as any).data_instalacao = null;
    
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

  uploadPhoto: async (ativoId: number, file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `ativos/${ativoId}/photos/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('ativos-photos').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('ativos-photos').getPublicUrl(filePath);
    return data.publicUrl;
  },

  savePhoto: async (ativoId: number, url: string) => {
    const { error } = await supabase.from('fotos').insert([{ id_ativo: ativoId, url }]);
    if (error) throw error;
  },

  createAlert: async (alertData: { 
  id_ativo: number; 
  titulo: string; 
  mensagem: string; 
  tipo_alerta: string; 
  estado: string 
}) => {
  const { data, error } = await supabase
    .from('alertas')
    .insert([{
      id_ativo: alertData.id_ativo,
      tipo_alerta: alertData.tipo_alerta, // avaria, manutencao, etc.
      estado: alertData.estado || 'pendente',
      titulo: alertData.titulo,
      mensagem: alertData.mensagem,
      data_alerta: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar alerta:", error);
    throw error;
  }
  return data;
},

  updateAlertStatus: async (id_alerta: number, novoEstado: 'pendente' | 'resolvido') => {
  const { data, error } = await supabase
    .from('alertas')
    .update({ estado: novoEstado })
    .eq('id_alerta', id_alerta)
    .select()
    .single();

  if (error) throw error;
  return data;
},

  // GESTÃO DE DOCUMENTOS
  uploadDocument: async (ativoId: number, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `ativos/${ativoId}/documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ativos-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('ativos-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  saveDocument: async (documentData: { 
    id_ativo: number; 
    nome: string; 
    tipo_documento: string; 
    url: string; 
  }): Promise<Documento> => {
    const { data, error } = await supabase
      .from('documentos' as any)
      .insert([{
        id_ativo: documentData.id_ativo,
        nome: documentData.nome,
        tipo_documento: documentData.tipo_documento,
        url: documentData.url,
        // Removido data_emissao para bater certo com a base de dados
        data_upload: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Documento;
  }


  
};