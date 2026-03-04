import { supabase } from '@/supabase-client';

export type UserRole = 'gestor' | 'residente' | 'tecnico';

export type UserProfile = {
  id_user: string;
  primeiro_nome: string;
  ultimo_nome: string;
  empresa: string;
  role?: UserRole;
  created_at?: string;
};

export const userProfilesApi = {
  list: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id_user,primeiro_nome,ultimo_nome,empresa,role,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as UserProfile[];
  },

  updateRole: async (id_user: string, role: UserRole): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id_user', id_user)
      .select('id_user,primeiro_nome,ultimo_nome,empresa,role,created_at')
      .single();
    if (error) throw error;
    return data as UserProfile;
  },
};

