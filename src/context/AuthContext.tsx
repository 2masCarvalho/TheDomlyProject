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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupForm) => Promise<void>;
  logout: () => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id_user', id)
      .single<Profile>();

    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Confirma o teu email antes de entrar.");
      }
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
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
