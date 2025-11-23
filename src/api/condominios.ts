import { supabase } from '@/supabase-client';

export interface Condominio {
  id_comdominio: number;
  nome: string;
  cidade: string;
  morada: string;
  codigo_postal: string;
  nif: number;
  id_user: string;
  created_at: string;
}

export interface CreateCondominioData {
  nome: string;
  cidade: string;
  morada: string;
  codigo_postal: string;
  nif: number;
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
};

