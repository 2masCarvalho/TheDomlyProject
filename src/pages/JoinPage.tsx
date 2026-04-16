import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/supabase-client';
import { membershipsApi, type InviteTokenInfo } from '@/api/memberships';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, CheckCircle2, Loader2, UserPlus, LogIn, AlertTriangle } from 'lucide-react';

// ── Form schemas ───────────────────────────────────────────────────────────────

const registerSchema = z.object({
  nome_completo: z.string().min(2, 'Obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Obrigatório'),
});

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

// ── Role label helper ──────────────────────────────────────────────────────────

const roleLabel = (role: string) =>
  role === 'tecnico' ? 'Técnico' : 'Residente';

// ── Page ───────────────────────────────────────────────────────────────────────

type View = 'loading' | 'invalid' | 'register' | 'login' | 'verify_email' | 'claiming' | 'success';

export const JoinPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('loading');
  const [tokenInfo, setTokenInfo] = useState<InviteTokenInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // ── Claim an invite for an already-authenticated user ─────────────────────

  const claimForCurrentUser = async (nome: string, email: string) => {
    if (!token) return;
    setView('claiming');
    try {
      await membershipsApi.claimInvite(token, { nome, email });
      setView('success');
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Erro ao aceitar convite.');
      setView('invalid');
    }
  };

  // ── On mount: validate token + check existing session ────────────────────

  useEffect(() => {
    if (!token) {
      setView('invalid');
      setErrorMsg('Link de convite inválido.');
      return;
    }

    const init = async () => {
      // 1. Validate the token first (public call — no auth needed)
      const info = await membershipsApi.getTokenInfo(token);
      if (!info) {
        setErrorMsg('Este convite é inválido, já foi utilizado ou expirou.');
        setView('invalid');
        return;
      }
      setTokenInfo(info);

      // 2. If the user is already authenticated, claim immediately
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const nome = session.user.user_metadata?.primeiro_nome
          ? `${session.user.user_metadata.primeiro_nome} ${session.user.user_metadata.ultimo_nome ?? ''}`.trim()
          : session.user.email ?? '';
        await claimForCurrentUser(nome, session.user.email ?? '');
        return;
      }

      // 3. Check if we're returning from an email confirmation link
      // (Supabase adds #access_token=... to the redirect URL)
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        // The onAuthStateChange handler below will fire with SIGNED_IN
        setView('claiming');
        return;
      }

      setView('register');
    };

    init();

    // Listen for SIGNED_IN after email confirmation redirect
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && view === 'claiming') {
        listener.subscription.unsubscribe();
        const nome = session.user.user_metadata?.primeiro_nome
          ? `${session.user.user_metadata.primeiro_nome} ${session.user.user_metadata.ultimo_nome ?? ''}`.trim()
          : session.user.email ?? '';
        await claimForCurrentUser(nome, session.user.email ?? '');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Register handler ──────────────────────────────────────────────────────

  const handleRegister = async (data: RegisterForm) => {
    if (!token) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const nameParts = data.nome_completo.trim().split(' ');
      const primeiro_nome = nameParts[0];
      const ultimo_nome = nameParts.slice(1).join(' ');

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { primeiro_nome, ultimo_nome },
          emailRedirectTo: `${window.location.origin}/join/${token}`,
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.session) {
        // Email confirmation not required — create profile and claim immediately
        await supabase.from('users').insert({
          id_user: signUpData.user!.id,
          primeiro_nome,
          ultimo_nome,
          empresa: '',
          plano: 'starter',
        });
        await membershipsApi.claimInvite(token, { nome: data.nome_completo, email: data.email });
        setView('success');
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        // Email confirmation required — inform the user
        setView('verify_email');
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Erro ao criar conta.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Login handler ─────────────────────────────────────────────────────────

  const handleLogin = async (data: LoginForm) => {
    if (!token) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      const user = signInData.session?.user;
      const nome = user?.user_metadata?.primeiro_nome
        ? `${user.user_metadata.primeiro_nome} ${user.user_metadata.ultimo_nome ?? ''}`.trim()
        : data.email;

      await membershipsApi.claimInvite(token, { nome, email: data.email });
      setView('success');
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Email ou password incorretos.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(-45deg, #0a1128, #1B2A4A, #1a4a7a, #0d6b7a)', backgroundSize: '400% 400%' }}
    >
      <div className="w-full max-w-md">

        {/* ── Loading ── */}
        {(view === 'loading' || view === 'claiming') && (
          <div className="bg-white rounded-2xl border shadow-lg p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-600 text-sm">
              {view === 'claiming' ? 'A aceitar convite...' : 'A verificar convite...'}
            </p>
          </div>
        )}

        {/* ── Invalid ── */}
        {view === 'invalid' && (
          <div className="bg-white rounded-2xl border shadow-lg p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-slate-900">Convite inválido</h2>
            <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
            <Button variant="outline" onClick={() => navigate('/login')}>Ir para o login</Button>
          </div>
        )}

        {/* ── Success ── */}
        {view === 'success' && (
          <div className="bg-white rounded-2xl border shadow-lg p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-slate-900">Bem-vindo!</h2>
            <p className="text-slate-500 text-sm">
              Adicionado a <strong>{tokenInfo?.condominio.nome}</strong> como {roleLabel(tokenInfo?.token.role ?? 'residente')}.
            </p>
            <p className="text-slate-400 text-xs mt-3">A redirecionar para o dashboard...</p>
          </div>
        )}

        {/* ── Verify email ── */}
        {view === 'verify_email' && (
          <div className="bg-white rounded-2xl border shadow-lg p-8 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Confirme o seu email</h2>
            <p className="text-slate-500 text-sm mb-4">
              Enviámos um email de confirmação. Clique no link para ativar a conta —
              será redirecionado automaticamente de volta para aceitar o convite.
            </p>
            <p className="text-xs text-slate-400">Verifique também a pasta de spam.</p>
          </div>
        )}

        {/* ── Register form ── */}
        {view === 'register' && tokenInfo && (
          <div className="bg-white rounded-2xl border shadow-lg p-8">
            {/* Condominium badge */}
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-blue-500 font-medium">Convite para</p>
                <p className="text-sm font-semibold text-blue-900 truncate">{tokenInfo.condominio.nome}</p>
                <p className="text-[11px] text-blue-500">Função: {roleLabel(tokenInfo.token.role)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Criar conta</h2>
              <p className="text-slate-500 text-sm">Registe-se para aceitar o convite.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{errorMsg}</div>
            )}

            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <Label htmlFor="nome_completo">Nome completo</Label>
                <Input id="nome_completo" placeholder="Ana Silva" {...registerForm.register('nome_completo')} />
                {registerForm.formState.errors.nome_completo && (
                  <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.nome_completo.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ana@email.pt" {...registerForm.register('email')} />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...registerForm.register('password')} />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Criar conta e aceitar convite
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setView('login'); setErrorMsg(null); }}
                className="text-xs text-slate-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
              >
                Já tenho conta — fazer login
              </button>
            </div>
          </div>
        )}

        {/* ── Login form ── */}
        {view === 'login' && tokenInfo && (
          <div className="bg-white rounded-2xl border shadow-lg p-8">
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-blue-500 font-medium">Convite para</p>
                <p className="text-sm font-semibold text-blue-900 truncate">{tokenInfo.condominio.nome}</p>
                <p className="text-[11px] text-blue-500">Função: {roleLabel(tokenInfo.token.role)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Entrar na conta</h2>
              <p className="text-slate-500 text-sm">Faça login para aceitar o convite.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{errorMsg}</div>
            )}

            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="login_email">Email</Label>
                <Input id="login_email" type="email" placeholder="ana@email.pt" {...loginForm.register('email')} />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="login_password">Password</Label>
                <Input id="login_password" type="password" {...loginForm.register('password')} />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Entrar e aceitar convite
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setView('register'); setErrorMsg(null); }}
                className="text-xs text-slate-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
              >
                Ainda não tenho conta — criar conta
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
