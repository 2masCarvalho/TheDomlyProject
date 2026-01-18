import { supabase } from '@/supabase-client';

export interface Condominio {
  id_comdominio: number;
  nome: string;
  cidade: string;
  morada: string;
  codigo_postal: string;
  nif: number;
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
  created_at: string;
}

export interface CreateCondominioData {
  nome: string;
  cidade: string;
  morada: string;
  codigo_postal: string;
  nif: number;
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
  getAll: async (): Promise<Condominio[]> => {
    const { data, error } = await supabase
      .from('condominios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (condominio: CreateCondominioData) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data, error } = await supabase
      .from('condominios')
      .insert([{ ...condominio, id_user: userId }]);

    if (error) throw error;
    return data;
  },

  update: async (id: number, condominio: Partial<CreateCondominioData>) => {
    const { data, error } = await supabase
      .from('condominios')
      .update(condominio)
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

