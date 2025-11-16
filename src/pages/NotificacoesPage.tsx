import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAtivos } from '@/context/AtivosContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, Calendar, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificacoesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { condominios, loading: condominiosLoading } = useCondominios();
  const { getAtivosByCondominio } = useAtivos();

  const condominioId = parseInt(id || '0');
  const condominio = condominios.find((c) => c.id_condominio === id);
  const ativos = getAtivosByCondominio(condominioId);

  const notificationColors = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    aviso: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    urgente: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  };

  const notificationBadges = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    aviso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    urgente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  // Agregar todas as notificações
  const todasNotificacoes = useMemo(() => {
    const notifs = ativos.flatMap((ativo) =>
      (ativo.notificacoes || []).map((notif) => ({
        ...notif,
        ativo_nome: ativo.nome,
        ativo_id: ativo.id,
      }))
    );
    return notifs.sort((a, b) => 
      new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    );
  }, [ativos]);

  const notificacoesNaoLidas = useMemo(
    () => todasNotificacoes.filter((n) => !n.lida),
    [todasNotificacoes]
  );

  // Agregar todas as manutenções
  const manutencoes = useMemo(() => {
    const hoje = new Date();
    const manut = ativos
      .filter((ativo) => ativo.data_proxima_manutencao)
      .map((ativo) => ({
        id: ativo.id,
        nome: ativo.nome,
        data: ativo.data_proxima_manutencao!,
        tipo: ativo.tipo,
        estado: ativo.estado,
        urgente: isBefore(new Date(ativo.data_proxima_manutencao!), addDays(hoje, 7)),
      }))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    return manut;
  }, [ativos]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const total = ativos.length;
    const comNotificacoes = ativos.filter((a) => (a.notificacoes || []).length > 0).length;
    const comManutencao = ativos.filter((a) => a.data_proxima_manutencao).length;
    const notifUrgentes = todasNotificacoes.filter((n) => n.tipo === 'urgente' && !n.lida).length;
    
    return {
      total,
      comNotificacoes,
      comManutencao,
      notifUrgentes,
      percentualMonitorado: total > 0 ? Math.round((comNotificacoes / total) * 100) : 0,
    };
  }, [ativos, todasNotificacoes]);

  if (condominiosLoading) {
    return <LoadingSpinner />;
  }

  if (!condominio) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Condomínio não encontrado</h1>
          <Button onClick={() => navigate('/condominios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Condomínios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/condominios/${condominioId}/ativos`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Ativos
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Notificações e Manutenções</h1>
            <p className="text-muted-foreground">{condominio.nome}</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Não Lidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {notificacoesNaoLidas.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {estatisticas.notifUrgentes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monitorização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {estatisticas.percentualMonitorado}%
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout de 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna 1: Notificações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notificações
                {notificacoesNaoLidas.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {notificacoesNaoLidas.length}
                  </Badge>
                )}
              </h2>
            </div>

            {todasNotificacoes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma notificação registada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {todasNotificacoes.map((notif) => (
                  <Card
                    key={`${notif.ativo_id}-${notif.id}`}
                    className={`${notificationColors[notif.tipo]} border-2 transition-all hover:shadow-md cursor-pointer`}
                    onClick={() => navigate(`/condominios/${condominioId}/ativos/${notif.ativo_id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={notificationBadges[notif.tipo]}>
                              {notif.tipo}
                            </Badge>
                            {!notif.lida && (
                              <Badge variant="outline" className="text-xs">
                                Nova
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base">{notif.titulo}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {notif.ativo_nome}
                          </CardDescription>
                        </div>
                        <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm mb-2">{notif.mensagem}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notif.data_criacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Coluna 2: Manutenções */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Manutenções Agendadas
              {manutencoes.filter((m) => m.urgente).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {manutencoes.filter((m) => m.urgente).length} próximas
                </Badge>
              )}
            </h2>

            {manutencoes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma manutenção agendada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {manutencoes.map((manut) => (
                  <Card
                    key={manut.id}
                    className={`transition-all hover:shadow-md cursor-pointer ${
                      manut.urgente ? 'border-2 border-destructive' : ''
                    }`}
                    onClick={() => navigate(`/condominios/${condominioId}/ativos/${manut.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base">{manut.nome}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {manut.tipo}
                          </CardDescription>
                        </div>
                        {manut.urgente && (
                          <Badge variant="destructive" className="flex-shrink-0">
                            Urgente
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(manut.data), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={
                            manut.estado === 'excelente'
                              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                              : manut.estado === 'bom'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : manut.estado === 'regular'
                              ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }
                        >
                          {manut.estado}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
