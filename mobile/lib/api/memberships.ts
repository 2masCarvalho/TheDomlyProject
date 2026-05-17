import { supabase } from '../supabase';
import type { Condominio } from './condominios';

export type MembershipRole = 'residente' | 'tecnico';

export interface InviteTokenInfo {
  token: {
    token: string;
    id_condominio: number;
    role: MembershipRole;
    expires_at: string;
    used_at: string | null;
  };
  condominio: { nome: string; morada: string };
}

export interface MemberCondominio {
  condominio: Condominio;
  role: MembershipRole;
}

export const membershipsApi = {
  /** Validate an invite token and return condominio info. Public SELECT policy allows pre-auth calls. */
  getTokenInfo: async (token: string): Promise<InviteTokenInfo | null> => {
    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) return null;
    if (new Date(tokenData.expires_at) < new Date()) return null;

    const { data: condData } = await supabase
      .from('condominios')
      .select('nome, morada')
      .eq('id_comdominio', tokenData.id_condominio)
      .single();

    return {
      token: tokenData,
      condominio: condData ?? { nome: 'Condomínio', morada: '' },
    };
  },

  /** Claim an invite for the currently authenticated user. Idempotent — duplicate inserts are ignored. */
  claimInvite: async (
    token: string,
    userDisplay: { nome: string; email: string },
  ): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Não autenticado.');

    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) throw new Error('Convite inválido ou já utilizado.');
    if (new Date(tokenData.expires_at) < new Date()) throw new Error('Este convite expirou.');

    const { error: memberError } = await supabase.from('condominio_memberships').insert({
      id_condominio: tokenData.id_condominio,
      id_user: userId,
      role: tokenData.role,
      nome_utilizador: userDisplay.nome,
      email_utilizador: userDisplay.email,
    });

    if (
      memberError &&
      !memberError.message?.includes('duplicate') &&
      !memberError.code?.includes('23505')
    ) {
      throw memberError;
    }

    await supabase
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq('token', token);
  },

  /** All condominios the current user is a member of (residente or tecnico). */
  getMemberCondominios: async (): Promise<MemberCondominio[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('condominio_memberships')
      .select('role, condominios(*)')
      .eq('id_user', userId);

    if (error) throw error;

    return (data ?? [])
      .filter((row: any) => row.condominios)
      .map((row: any) => ({
        condominio: row.condominios as Condominio,
        role: row.role as MembershipRole,
      }));
  },
};
