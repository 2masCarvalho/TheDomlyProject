/*
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - replace with actual authentication
    const mockUser = { email, id: '1', name: email.split('@')[0] };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
*/

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase-client';
import type { User } from '@supabase/supabase-js';

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
  signup: (payload: {
    primeiro_nome: string;
    ultimo_nome: string;
    empresa: string;
    email: string;
    password: string;
  }) => Promise<void>;
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
    // inicial fetch do session/user
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      setLoading(false);
    };
    init();

    // listener para mudanças de auth
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
      // se não existir perfil, apenas deixe o profile null (pode fazer onboarding)
      setProfile(null);
      return;
    }
    setProfile(data);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange tratará fetchProfile
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: {
    primeiro_nome: string;
    ultimo_nome: string;
    empresa: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      // 1) cria conta no Auth
      const { data, error: signError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        // opcional: podes passar user_metadata se quiseres
        options: { data: { primeiro_nome: payload.primeiro_nome, ultimo_nome: payload.ultimo_nome, empresa: payload.empresa } },
      });

      if (signError) throw signError;
      // 2) se o signup devolveu user (ou se confirmação por email for necessária), obter user id
      const userId = data?.user?.id;
      if (!userId) {
        // Se for necessário confirmação por email, o user pode ser null até confirmar.
        // Em muitos projetos, inserimos o profile só após o user confirmar o email.
        // Aqui assumimos que podemos inserir agora se tivermos o id.
        throw new Error('Não foi possível obter o id do utilizador. Confirmação por email pode ser necessária.');
      }

      // 3) inserir profile na tabela public.users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id_user: userId,
          primeiro_nome: payload.primeiro_nome,
          ultimo_nome: payload.ultimo_nome,
          empresa: payload.empresa,
        });

      if (insertError) throw insertError;

      // 4) buscar profile e guardar no estado (fetchProfile)
      await fetchProfile(userId);
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
