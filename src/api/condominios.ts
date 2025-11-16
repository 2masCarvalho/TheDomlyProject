import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Condominio = Tables<'condominio'>;
export type CreateCondominioData = Omit<TablesInsert<'condominio'>, 'id_condominio' | 'created_at' | 'updated_at' | 'data_criacao' | 'id_user'>;
export type UpdateCondominioData = Partial<CreateCondominioData>;

export const condominiosApi = {
  getAll: async (): Promise<Condominio[]> => {
    const { data, error } = await supabase
      .from('condominio')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getById: async (id: string): Promise<Condominio | null> => {
    const { data, error } = await supabase
      .from('condominio')
      .select('*')
      .eq('id_condominio', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  create: async (condominioData: CreateCondominioData): Promise<Condominio> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('condominio')
      .insert({
        ...condominioData,
        id_user: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, condominioData: UpdateCondominioData): Promise<Condominio> => {
    const { data, error } = await supabase
      .from('condominio')
      .update(condominioData)
      .eq('id_condominio', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('condominio')
      .delete()
      .eq('id_condominio', id);

    if (error) throw error;
  },
};
