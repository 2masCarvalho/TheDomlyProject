import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/supabase-client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Upload, CreditCard } from 'lucide-react';

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  primeiro_nome: z.string().min(1, 'Obrigatório'),
  ultimo_nome: z.string().min(1, 'Obrigatório'),
  empresa: z.string().min(1, 'Obrigatório'),
});

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As passwords não coincidem',
    path: ['confirm'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const { user, profile, avatarUrl, setAvatarUrl, refreshProfile } = useAuth();
  const [avatarLoading, setAvatarLoading] = React.useState(false);

  const getUserInitials = () => {
    if (profile?.primeiro_nome && profile?.ultimo_nome) {
      return `${profile.primeiro_nome[0]}${profile.ultimo_nome[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() ?? 'U';
  };

  // ── Profile form ────────────────────────────────────────────────────────────

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      primeiro_nome: profile?.primeiro_nome ?? '',
      ultimo_nome: profile?.ultimo_nome ?? '',
      empresa: profile?.empresa ?? '',
    },
  });

  const onSaveProfile = async (data: ProfileForm) => {
    if (!user) return;
    const { error } = await supabase
      .from('users')
      .upsert({ id_user: user.id, ...data }, { onConflict: 'id_user' });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Perfil atualizado', description: 'As alterações foram guardadas.' });
    }
  };

  // ── Avatar upload ───────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    const { error } = await supabase.storage
      .from('avatars')
      .upload(`${user.id}/avatar`, file, { upsert: true });

    if (error) {
      toast({ title: 'Erro ao carregar imagem', description: error.message, variant: 'destructive' });
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(`${user.id}/avatar`);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      toast({ title: 'Foto atualizada' });
    }
    setAvatarLoading(false);
  };

  // ── Email form ──────────────────────────────────────────────────────────────

  const {
    register: regEmail,
    handleSubmit: handleEmail,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user?.email ?? '' },
  });

  const onSaveEmail = async (data: EmailForm) => {
    const { error } = await supabase.auth.updateUser({ email: data.email });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email atualizado', description: 'Confirma o novo email para ativar a alteração.' });
    }
  };

  // ── Password form ───────────────────────────────────────────────────────────

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSavePassword = async (data: PasswordForm) => {
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password atualizada' });
      resetPassword();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Definições</h1>

      <Tabs defaultValue="perfil">
        <TabsList className="mb-6">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="subscricao">Subscrição</TabsTrigger>
        </TabsList>

        {/* ── PERFIL ── */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Informação do Perfil</CardTitle>
              <CardDescription>Atualiza a tua foto e dados pessoais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl ?? ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {avatarLoading ? 'A carregar...' : 'Alterar foto'}
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP. Máx. 2 MB.</p>
                </div>
              </div>

              <Separator />

              {/* Profile fields */}
              <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Primeiro Nome</Label>
                    <Input {...regProfile('primeiro_nome')} disabled={profileSubmitting} />
                    {profileErrors.primeiro_nome && (
                      <p className="text-sm text-destructive">{profileErrors.primeiro_nome.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Último Nome</Label>
                    <Input {...regProfile('ultimo_nome')} disabled={profileSubmitting} />
                    {profileErrors.ultimo_nome && (
                      <p className="text-sm text-destructive">{profileErrors.ultimo_nome.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Empresa</Label>
                  <Input {...regProfile('empresa')} disabled={profileSubmitting} />
                  {profileErrors.empresa && (
                    <p className="text-sm text-destructive">{profileErrors.empresa.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={profileSubmitting}>
                  {profileSubmitting ? 'A guardar...' : 'Guardar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SEGURANÇA ── */}
        <TabsContent value="seguranca">
          <div className="space-y-4">

            {/* Change email */}
            <Card>
              <CardHeader>
                <CardTitle>Alterar Email</CardTitle>
                <CardDescription>Um email de confirmação será enviado para o novo endereço.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmail(onSaveEmail)} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Novo Email</Label>
                    <Input type="email" {...regEmail('email')} disabled={emailSubmitting} />
                    {emailErrors.email && (
                      <p className="text-sm text-destructive">{emailErrors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={emailSubmitting}>
                    {emailSubmitting ? 'A guardar...' : 'Atualizar Email'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change password */}
            <Card>
              <CardHeader>
                <CardTitle>Alterar Password</CardTitle>
                <CardDescription>Escolhe uma password segura com pelo menos 6 caracteres.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePassword(onSavePassword)} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Nova Password</Label>
                    <Input type="password" {...regPassword('password')} disabled={passwordSubmitting} />
                    {passwordErrors.password && (
                      <p className="text-sm text-destructive">{passwordErrors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Confirmar Password</Label>
                    <Input type="password" {...regPassword('confirm')} disabled={passwordSubmitting} />
                    {passwordErrors.confirm && (
                      <p className="text-sm text-destructive">{passwordErrors.confirm.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={passwordSubmitting}>
                    {passwordSubmitting ? 'A guardar...' : 'Atualizar Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── SUBSCRIÇÃO ── */}
        <TabsContent value="subscricao">
          <Card>
            <CardHeader>
              <CardTitle>Subscrição</CardTitle>
              <CardDescription>Gere o teu plano e faturação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/40">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Plano Atual</p>
                    <p className="text-sm text-muted-foreground">Domly Pro</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">Ativo</span>
              </div>
              <Button variant="outline" className="w-full">
                Gerir Subscrição
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
