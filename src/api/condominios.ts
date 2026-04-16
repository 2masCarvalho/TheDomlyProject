import { supabase } from '@/supabase-client';

export interface Condominio {
  id_comdominio: number;
  nome: string;
  cidade: string;
  morada: string;
  codigo_postal: string;
  nif?: number | null;
  iban?: string;
  banco?: string;
  num_fracoes?: number;
  num_pisos?: number;
  ano_construcao?: number;
  tem_elevador?: boolean;
  email_geral?: string;
  telefone?: string;
  admin_externa?: boolean;
  apolice_seguro?: string;
  companhia_seguro?: string;
  id_user: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  /** Set by the app layer when this condominio is accessed via membership (not owned). */
  memberRole?: 'residente' | 'tecnico';
}

export interface CreateCondominioData {
  nome: string;
  cidade: string;
  morada: string;
  codigo_postal: string;
  nif?: number | null;
  iban?: string;
  banco?: string;
  num_fracoes?: number;
  num_pisos?: number;
  ano_construcao?: number;
  tem_elevador?: boolean;
  email_geral?: string;
  telefone?: string;
  admin_externa?: boolean;
  apolice_seguro?: string;
  companhia_seguro?: string;
  image_url?: string;
}

export const condominiosApi = {
  getAll: async (options?: { includeInactive?: boolean }): Promise<Condominio[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    let query = supabase
      .from('condominios')
      .select('*')
      .eq('id_user', userId)
      .order('created_at', { ascending: false });

    if (!options?.includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  create: async (condominio: CreateCondominioData) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    // Clean up empty strings or undefined to avoid DB check constraint errors (e.g. on codigo_postal)
    const payload: any = { ...condominio, id_user: userId };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === undefined) {
        payload[key] = null;
      }
    });

    const { data, error } = await supabase
      .from('condominios')
      .insert([payload]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }
    return data;
  },

  update: async (id: number, condominio: Partial<CreateCondominioData>) => {
    const payload: any = { ...condominio };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === undefined) {
        payload[key] = null;
      }
    });

    const { data, error } = await supabase
      .from('condominios')
      .update(payload)
      .eq('id_comdominio', id);

    if (error) throw error;
    return data;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('condominios')
      .delete()
      .eq('id_comdominio', id);

    if (error) throw error;
  },

  deactivate: async (id: number) => {
    const { error } = await supabase
      .from('condominios')
      .update({ is_active: false })
      .eq('id_comdominio', id);

    if (error) throw error;
  },

  reactivate: async (id: number) => {
    const { error } = await supabase
      .from('condominios')
      .update({ is_active: true })
      .eq('id_comdominio', id);

    if (error) throw error;
  },

  uploadImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('condominio-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('condominio-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};

