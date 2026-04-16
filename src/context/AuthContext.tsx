import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase-client';
import type { User } from '@supabase/supabase-js';
import type { SignupForm } from '@/pages/SignupPage';

type Profile = {
  id_user: string;
  primeiro_nome: string;
  ultimo_nome: string;
  empresa: string;
  created_at?: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  avatarUrl: string | null;
  loading: boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${session.user.id}/avatar`);
        setAvatarUrl(data.publicUrl);
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
      } else {
        setProfile(null);
        setAvatarUrl(null);
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

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

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
  };

  return (
    <AuthContext.Provider value={{ user, profile, avatarUrl, loading, login, signup, logout, refreshProfile, setAvatarUrl }}>
      {children}
    </AuthContext.Provider>
  );
};
