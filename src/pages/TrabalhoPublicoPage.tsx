import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trabalhosApi, TrabalhoPublico } from '@/api/trabalhos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Wrench, Building2, AlertTriangle, FlaskConical } from 'lucide-react';

const DEMO_JOB: TrabalhoPublico = {
  id_trabalho: 0,
  titulo: 'Substituição de extintor — Piso 3',
  descricao: 'O extintor do corredor do 3.º piso está com a inspeção em falta. Necessário substituir antes da vistoria de dia 28.',
  categoria: 'geral',
  urgencia: 'alta',
  estado: 'aberto',
  is_urgente: true,
  token_tecnico: 'demo',
  created_at: new Date().toISOString(),
  condominio_nome: 'Edifício Central — Lisboa',
};

const urgenciaConfig: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-300' },
  alta:    { label: 'Alta',    color: 'bg-orange-100 text-orange-700 border-orange-300' },
  media:   { label: 'Média',   color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  baixa:   { label: 'Baixa',  color: 'bg-green-100 text-green-700 border-green-300' },
};

const categoriaLabels: Record<string, string> = {
  'canalização': 'Canalização', eletricidade: 'Eletricidade', serralharia: 'Serralharia',
  pintura: 'Pintura', avac: 'AVAC', geral: 'Geral',
};

export const TrabalhoPublicoPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [trabalho, setTrabalho] = useState<TrabalhoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [result, setResult] = useState<'aceite' | 'cancelado' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDemo = token === 'demo';

  useEffect(() => {
    if (isDemo) {
      setTrabalho(DEMO_JOB);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        if (!token) throw new Error('Link inválido');
        const data = await trabalhosApi.getPublico(token);
        if (!data) throw new Error('Trabalho não encontrado');
        setTrabalho(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar trabalho');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleResponder = async (aceitar: boolean) => {
    if (!token) return;
    setResponding(true);
    try {
      if (!isDemo) {
        await trabalhosApi.responderPublico(token, aceitar);
      } else {
        // Demo mode: simulate network delay
        await new Promise((r) => setTimeout(r, 800));
      }
      setResult(aceitar ? 'aceite' : 'cancelado');
    } catch (err: any) {
      setError(err.message || 'Erro ao registar resposta');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border shadow-lg p-8 max-w-sm w-full text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Link inválido</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (result === 'aceite') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border shadow-lg p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Trabalho aceite!</h2>
          <p className="text-muted-foreground text-sm">
            O gestor foi notificado. Dirija-se ao local conforme acordado.
          </p>
          <p className="mt-4 font-semibold">{trabalho?.titulo}</p>
          {trabalho?.condominio_nome && (
            <p className="text-sm text-muted-foreground">{trabalho.condominio_nome}</p>
          )}
        </div>
      </div>
    );
  }

  if (result === 'cancelado') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border shadow-lg p-8 max-w-sm w-full text-center">
          <XCircle className="h-14 w-14 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cancelamento registado</h2>
          <p className="text-muted-foreground text-sm">
            O gestor foi informado e irá encontrar outro técnico disponível.
          </p>
        </div>
      </div>
    );
  }

  const alreadyActioned = trabalho?.estado === 'concluido' || trabalho?.estado === 'cancelado';
  const urgCfg = urgenciaConfig[trabalho?.urgencia || ''];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border shadow-lg w-full max-w-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Domly · Trabalho de Manutenção</span>
            </div>
            {isDemo && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                <FlaskConical className="h-3 w-3" /> Demo
              </span>
            )}
          </div>
          {isDemo && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-3">
              Isto é uma demonstração. Os botões funcionam mas não gravam dados reais.
            </div>
          )}
          {trabalho?.is_urgente && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Trabalho urgente — necessitamos de técnico com urgência
            </div>
          )}
          <h1 className="text-xl font-bold mb-2">{trabalho?.titulo}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {urgCfg && (
              <Badge variant="outline" className={`text-xs ${urgCfg.color}`}>
                {urgCfg.label}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {categoriaLabels[trabalho?.categoria || ''] || trabalho?.categoria}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {trabalho?.condominio_nome && (
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Edifício</p>
                <p className="text-sm font-medium">{trabalho.condominio_nome}</p>
              </div>
            </div>
          )}
          {trabalho?.descricao && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm">{trabalho.descricao}</p>
            </div>
          )}

          {alreadyActioned ? (
            <div className="p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground text-center">
              Este trabalho já foi {trabalho?.estado === 'concluido' ? 'concluído' : 'cancelado'}.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Button
                className="w-full h-12 text-base"
                onClick={() => handleResponder(true)}
                disabled={responding}
              >
                {responding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Aceitar Trabalho
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => handleResponder(false)}
                disabled={responding}
              >
                Não Posso Comparecer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
