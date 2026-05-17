import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/supabase-client';
import type { User } from '@supabase/supabase-js';
import type { SignupForm } from '@/pages/SignupPage';
import { membershipsApi } from '@/api/memberships';
import { condominiosApi } from '@/api/condominios';
import type { Condominio } from '@/api/condominios';

type Profile = {
  id_user: string;
  primeiro_nome: string;
  ultimo_nome: string;
  empresa: string;
  created_at?: string;
};

export type AuthMembership = {
  condominio: Condominio;
  role: 'residente' | 'tecnico';
};

export type RoleSnapshot = {
  isOwner: boolean;
  isResident: boolean;
  residentMembership: AuthMembership | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  avatarUrl: string | null;
  loading: boolean;
  roleLoading: boolean;
  memberships: AuthMembership[];
  isOwner: boolean;
  isResident: boolean;
  residentMembership: AuthMembership | null;
  refreshRole: () => Promise<RoleSnapshot>;
  getRoleSnapshot: () => RoleSnapshot;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAvatarUrl: (url: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const computeSnapshot = (memberships: AuthMembership[], ownsAny: boolean): RoleSnapshot => {
  const isOwner = ownsAny;
  const residentMembership = memberships.find((m) => m.role === 'residente') ?? null;
  const isResident = !isOwner && residentMembership !== null;
  return { isOwner, isResident, residentMembership };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [memberships, setMemberships] = useState<AuthMembership[]>([]);
  const [ownsAnyCondominio, setOwnsAnyCondominio] = useState<boolean>(false);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);

  // Synchronous mirror so callers can read the latest snapshot without waiting for re-render.
  const snapshotRef = useRef<RoleSnapshot>({ isOwner: false, isResident: false, residentMembership: null });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${session.user.id}/avatar`);
        setAvatarUrl(data.publicUrl);
        await fetchRoleData();
      } else {
        setRoleLoading(false);
      }

      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${session.user.id}/avatar`);
        setAvatarUrl(data.publicUrl);
        fetchRoleData();
      } else {
        setProfile(null);
        setAvatarUrl(null);
        setMemberships([]);
        setOwnsAnyCondominio(false);
        snapshotRef.current = { isOwner: false, isResident: false, residentMembership: null };
        setRoleLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (id: string) => {
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id_user', id)
      .single<Profile>();

    // Se o perfil não existe na tabela public.users, cria-o agora.
    if (error && error.code === 'PGRST116') {
      const { data: authData } = await supabase.auth.getUser();
      const u = authData.user;
      if (u) {
        await supabase.from('users').insert({
          id_user: id,
          primeiro_nome: u.user_metadata?.primeiro_nome || u.email?.split('@')[0] || 'Conta',
          ultimo_nome: u.user_metadata?.ultimo_nome || '',
          empresa: u.user_metadata?.empresa || 'Empresa',
          plano: 'starter',
        });

        const retry = await supabase.from('users').select('*').eq('id_user', id).single<Profile>();
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data);
  };

  const fetchRoleData = async (): Promise<RoleSnapshot> => {
    setRoleLoading(true);
    try {
      const [memberRows, owned] = await Promise.all([
        membershipsApi.getMemberCondominios().catch(() => []),
        condominiosApi.getAll({ includeInactive: true }).catch(() => []),
      ]);
      const ms: AuthMembership[] = memberRows.map((r) => ({ condominio: r.condominio, role: r.role }));
      const ownsAny = owned.length > 0;
      setMemberships(ms);
      setOwnsAnyCondominio(ownsAny);
      const snapshot = computeSnapshot(ms, ownsAny);
      snapshotRef.current = snapshot;
      return snapshot;
    } finally {
      setRoleLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshRole = async (): Promise<RoleSnapshot> => fetchRoleData();
  const getRoleSnapshot = (): RoleSnapshot => snapshotRef.current;

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: SignupForm) => {
    setLoading(true);

    try {
      const { data, error: signError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signError) throw signError;

      const userId = data.user?.id;
      if (!userId) return;

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id_user: userId,
          primeiro_nome: payload.primeiro_nome,
          ultimo_nome: payload.ultimo_nome,
          empresa: payload.empresa,
        });

      if (insertError) throw insertError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMemberships([]);
    setOwnsAnyCondominio(false);
    snapshotRef.current = { isOwner: false, isResident: false, residentMembership: null };
  };

  const snapshot = computeSnapshot(memberships, ownsAnyCondominio);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        avatarUrl,
        loading,
        roleLoading,
        memberships,
        isOwner: snapshot.isOwner,
        isResident: snapshot.isResident,
        residentMembership: snapshot.residentMembership,
        refreshRole,
        getRoleSnapshot,
        login,
        signup,
        logout,
        refreshProfile,
        setAvatarUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
