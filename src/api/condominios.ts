import { supabase } from '@/integrations/supabase/client';

export interface Condominio {
  id_condominio: string;
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
      .from('condominio')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (condominio: CreateCondominioData) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data, error } = await supabase
      .from('condominio')
      .insert([{ ...condominio, id_user: userId }]);

    if (error) throw error;
    return data;
  },

  update: async (id: string, condominio: Partial<CreateCondominioData>) => {
    const { data, error } = await supabase
      .from('condominio')
      .update(condominio)
      .eq('id_condominio', id);

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('condominio')
      .delete()
      .eq('id_condominio', id);

    if (error) throw error;
  },
};

