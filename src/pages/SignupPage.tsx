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

export type SignupForm = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await signup(data);

      toast({
        title: "Conta criada",
        description: "Confirma o teu email antes de fazer login.",
      });

      navigate('/'); 
    } catch (error: any) {
      toast({
        title: "Erro no registo",
        description: error?.message ?? 'Não foi possível criar a conta',
        variant: "destructive",
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
          <CardDescription>Introduz os teus dados para criar a conta</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Primeiro Nome</Label>
                <Input {...register('primeiro_nome')} disabled={isLoading} />
                {errors.primeiro_nome && (
                  <p className="text-sm text-destructive">{errors.primeiro_nome.message}</p>
                )}
              </div>

              <div>
                <Label>Último Nome</Label>
                <Input {...register('ultimo_nome')} disabled={isLoading} />
                {errors.ultimo_nome && (
                  <p className="text-sm text-destructive">{errors.ultimo_nome.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Empresa</Label>
              <Input {...register('empresa')} disabled={isLoading} />
              {errors.empresa && (
                <p className="text-sm text-destructive">{errors.empresa.message}</p>
              )}
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" {...register('email')} disabled={isLoading} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" {...register('password')} disabled={isLoading} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')} className="w-1/2">
                Cancelar
              </Button>
              <Button type="submit" className="w-1/2" disabled={isLoading}>
                {isLoading ? "A criar..." : "Criar Conta"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;





