import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useCondominios } from '@/context/CondominiosContext';
import { useAtivos } from '@/context/AtivosContext';
import { useOcorrencias } from '@/context/OcorrenciasContext';
import { loadOnboardingState, resetOnboardingState } from '@/utils/onboardingState';

export const DefinicoesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { condominios } = useCondominios();
  const { ativos } = useAtivos();
  const { ocorrencias } = useOcorrencias();

  const st = loadOnboardingState(user?.id ?? null);

  const hasCondominio = (condominios?.length ?? 0) > 0 || st.hasCondominio === true;
  const hasQuickWin =
    st.didQuickWin === true || (ocorrencias?.length ?? 0) > 0 || (ativos?.length ?? 0) > 0;

  const pending: string[] = [];
  if (!hasCondominio) pending.push('Criar o primeiro condomínio');
  if (!hasQuickWin) pending.push('Registar a primeira ocorrência ou ativo');

  const handleResume = () => navigate('/onboarding?resume=1');

  const handleRestart = () => {
    resetOnboardingState();
    navigate('/onboarding?resume=1');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Definições</h1>
          <p className="text-muted-foreground text-sm">Preferências e configurações da conta.</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Onboarding</CardTitle>
          <CardDescription>Completa os passos que faltam, quando te der mais jeito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pending.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Onboarding concluído</p>
                <p className="text-sm text-muted-foreground">Já tens tudo pronto para usar a plataforma.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium mb-2">Pendente</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {pending.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleResume} className="sm:flex-1">
              Retomar onboarding
            </Button>
            <Button variant="outline" onClick={handleRestart} className="sm:flex-1">
              Recomeçar onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

