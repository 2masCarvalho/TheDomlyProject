import { supabase } from '@/supabase-client';
import type { Condominio } from '@/api/condominios';

export interface MemberCondominio {
  condominio: Condominio;
  role: MembershipRole;
}

export type MembershipRole = 'residente' | 'tecnico';

export interface InviteToken {
  id: string;
  token: string;
  id_condominio: number;
  role: MembershipRole;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

export interface InviteTokenInfo {
  token: InviteToken;
  condominio: { nome: string; morada: string };
}

export interface CondominioMembership {
  id: string;
  id_condominio: number;
  id_user: string;
  role: MembershipRole;
  nome_utilizador: string | null;
  email_utilizador: string | null;
  created_at: string;
}

export const membershipsApi = {
  // ── Invite tokens ──────────────────────────────────────────────────────────

  /** Create a 7-day invite token for a condominium (manager only). */
  createInviteToken: async (condominioId: number, role: MembershipRole): Promise<string> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('invite_tokens')
      .insert({ id_condominio: condominioId, role, created_by: userId })
      .select('token')
      .single();

    if (error) throw error;
    return data.token;
  },

  /** List non-expired, unused tokens for a condominium. */
  getActiveTokens: async (condominioId: number): Promise<InviteToken[]> => {
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('id_condominio', condominioId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /** Validate a token and return its info (public — no auth required). */
  getTokenInfo: async (token: string): Promise<InviteTokenInfo | null> => {
    // Fetch the token row first (invite_tokens has a public SELECT policy)
    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) return null;
    if (new Date(tokenData.expires_at) < new Date()) return null;

    // Fetch condominio info separately to avoid RLS join issues
    const { data: condData } = await supabase
      .from('condominios')
      .select('nome, morada')
      .eq('id_comdominio', tokenData.id_condominio)
      .single();

    return {
      token: tokenData as InviteToken,
      condominio: (condData ?? { nome: 'Condomínio', morada: '' }) as { nome: string; morada: string },
    };
  },

  /** Delete (revoke) an unused invite token. */
  revokeToken: async (tokenId: string): Promise<void> => {
    const { error } = await supabase
      .from('invite_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) throw error;
  },

  // ── Memberships ────────────────────────────────────────────────────────────

  /** List all members of a condominium. */
  getByCondominio: async (condominioId: number): Promise<CondominioMembership[]> => {
    const { data, error } = await supabase
      .from('condominio_memberships')
      .select('*')
      .eq('id_condominio', condominioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Claim an invite token for the currently authenticated user.
   * Validates the token, inserts the membership, and marks the token as used.
   * Idempotent: if the user is already a member the token is still consumed.
   */
  claimInvite: async (
    token: string,
    userDisplay: { nome: string; email: string },
  ): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Não autenticado');

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) throw new Error('Convite inválido ou já utilizado.');
    if (new Date(tokenData.expires_at) < new Date()) throw new Error('Este convite expirou.');

    // Insert membership (ignore duplicate — user may already be a member)
    const { error: memberError } = await supabase
      .from('condominio_memberships')
      .insert({
        id_condominio: tokenData.id_condominio,
        id_user: userId,
        role: tokenData.role,
        nome_utilizador: userDisplay.nome,
        email_utilizador: userDisplay.email,
      });

    if (memberError && !memberError.message.includes('duplicate') && !memberError.code?.includes('23505')) {
      throw memberError;
    }

    // Mark token as used
    await supabase
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq('token', token);
  },

  /** Fetch all condominios the current user is a member of (but does not own). */
  getMemberCondominios: async (): Promise<MemberCondominio[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('condominio_memberships')
      .select('role, condominios(*)')
      .eq('id_user', userId);

    if (error) throw error;

    return (data || [])
      .filter((row: any) => row.condominios)
      .map((row: any) => ({
        condominio: row.condominios as Condominio,
        role: row.role as MembershipRole,
      }));
  },

  /** Remove a member from a condominium (condo owner only). */
  removeMember: async (condominioId: number, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('condominio_memberships')
      .delete()
      .eq('id_condominio', condominioId)
      .eq('id_user', userId);

    if (error) throw error;
  },
};
