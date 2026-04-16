import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import DomlyLogo from '@/assets/domly-final-logo.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({ title: 'Login efetuado', description: 'Bem-vindo de volta!' });
      navigate('/condominios');
    } catch (error: any) {
      toast({
        title: 'Erro ao entrar',
        description: error?.message ?? 'Credenciais inválidas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 animate-gradient-shift"
      style={{
        background: "linear-gradient(-45deg, #0a1128, #1B2A4A, #1a4a7a, #0d6b7a)",
        backgroundSize: "400% 400%",
      }}
    >
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-10">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={DomlyLogo} alt="Domly" className="h-16 w-auto" />
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="text-sm text-gray-500 mt-1">Introduza as suas credenciais para aceder</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Email */}
          <div className="space-y-1">
            <Label className="text-gray-700">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="email"
                {...register('email')}
                disabled={isLoading}
                className="pl-9"
                placeholder="email@exemplo.com"
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Esqueceste-te da password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="password"
                {...register('password')}
                disabled={isLoading}
                className="pl-9"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'A entrar...' : 'Entrar'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Não tens conta?{' '}
            <Link to="/onboarding" className="text-primary hover:underline font-medium">
              Cria uma agora
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
