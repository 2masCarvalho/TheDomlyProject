/*
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';


export const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Conta na Domly</CardTitle>
          <CardDescription>
            Página de registo em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Esta funcionalidade estará disponível em breve.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Voltar à Página Inicial
            </Button>
            <Button onClick={() => navigate('/login')} className="w-full">
              Fazer Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
*/

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

const signupSchema = z.object({
  primeiro_nome: z.string().min(1, 'Obrigatório'),
  ultimo_nome: z.string().min(1, 'Obrigatório'),
  empresa: z.string().min(1, 'Obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
});

type SignupForm = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await signup({
        primeiro_nome: data.primeiro_nome,
        ultimo_nome: data.ultimo_nome,
        empresa: data.empresa,
        email: data.email,
        password: data.password,
      });
      toast({ title: 'Conta criada', description: 'Confirma o teu email se necessário.' });
      navigate('/condominios');
    } catch (error: any) {
      toast({
        title: 'Erro no registo',
        description: error?.message ?? 'Não foi possível criar a conta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Conta na Domly</CardTitle>
          <CardDescription>
            Introduz os teus dados para criar a conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="primeiro_nome">Primeiro Nome</Label>
                <Input id="primeiro_nome" {...register('primeiro_nome')} disabled={isLoading} />
                {errors.primeiro_nome && <p className="text-sm text-destructive">{errors.primeiro_nome.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ultimo_nome">Último Nome</Label>
                <Input id="ultimo_nome" {...register('ultimo_nome')} disabled={isLoading} />
                {errors.ultimo_nome && <p className="text-sm text-destructive">{errors.ultimo_nome.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input id="empresa" {...register('empresa')} disabled={isLoading} />
              {errors.empresa && <p className="text-sm text-destructive">{errors.empresa.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} disabled={isLoading} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} disabled={isLoading} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')} className="w-1/2">Cancelar</Button>
              <Button type="submit" className="w-1/2" disabled={isLoading}>{isLoading ? 'A criar...' : 'Criar Conta'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;




