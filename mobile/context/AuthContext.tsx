import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase } from '../lib/supabase';

interface Profile {
  id_user: string;
  primeiro_nome: string;
  ultimo_nome: string;
  empresa: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    primeiro_nome: string;
    ultimo_nome: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void hydrateProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        void hydrateProfile(newSession.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Supabase RN guide: tie auto-refresh to AppState so tokens don't churn while backgrounded.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  async function hydrateProfile(authUser: User) {
    setLoading(true);
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const fallback: Profile = {
      id_user: authUser.id,
      primeiro_nome: (meta.primeiro_nome as string) ?? 'Residente',
      ultimo_nome: (meta.ultimo_nome as string) ?? '',
      empresa: '',
    };

    const { data, error } = await supabase
      .from('users')
      .select('id_user, primeiro_nome, ultimo_nome, empresa')
      .eq('id_user', authUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
    } else if (!error) {
      // No row and no error → first sign-in via a path that didn't create the profile row.
      const { error: insertError } = await supabase.from('users').insert(fallback);
      if (insertError && insertError.code !== '23505') {
        console.warn('[auth] failed to auto-create profile', insertError);
      }
      setProfile(fallback);
    } else {
      // RLS or transport error — don't retry-insert (the row may already exist and we just
      // can't read it). Use auth metadata as a fallback profile; downstream features still work.
      console.warn('[auth] failed to load profile', error);
      setProfile(fallback);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp({
    email,
    password,
    primeiro_nome,
    ultimo_nome,
  }: {
    email: string;
    password: string;
    primeiro_nome: string;
    ultimo_nome: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { primeiro_nome, ultimo_nome },
      },
    });
    if (error) throw error;

    const newUser = data.user;
    if (newUser) {
      const { error: profileError } = await supabase.from('users').insert({
        id_user: newUser.id,
        primeiro_nome,
        ultimo_nome,
        empresa: '',
      });
      if (profileError && profileError.code !== '23505') {
        console.warn('[auth] failed to create profile row at signup', profileError);
      }
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
