import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAtivosAcrossBuildings, getExpiryStatus, AtivoComCondominio } from '@/api/ativos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, Wrench, Building2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';

type Tab = 'expirados' | 'a_expirar' | 'todos';

const tipoAtivoLabels: Record<string, string> = {
  extintor: 'Extintor',
  sadi: 'SADI',
  sadc: 'SADC',
  inspecao_gas: 'Inspeção de Gás',
  painel_solar: 'Painel Solar',
  seguro: 'Seguro',
  licenca_elevador: 'Licença de Elevador',
  outro: 'Outro',
};

const StatusBadge: React.FC<{ status: 'overdue' | 'soon' | 'ok' | null }> = ({ status }) => {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  if (status === 'overdue')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <AlertTriangle className="h-3 w-3" /> Expirado
      </span>
    );
  if (status === 'soon')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
        <Clock className="h-3 w-3" /> Em breve
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="h-3 w-3" /> OK
    </span>
  );
};

export const ConformidadePage: React.FC = () => {
  const navigate = useNavigate();
  const [ativos, setAtivos] = useState<AtivoComCondominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('expirados');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllAtivosAcrossBuildings();
        setAtivos(data);
      } catch (err) {
        console.error('Erro ao carregar ativos:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categorized = useMemo(() => {
    const today = new Date();
    const in30 = addDays(today, 30);

    const expirados = ativos.filter((a) => {
      if (!a.data_expiracao) return false;
      return new Date(a.data_expiracao) < today;
    });

    const a_expirar = ativos.filter((a) => {
      if (!a.data_expiracao) return false;
      const d = new Date(a.data_expiracao);
      return d >= today && d <= in30;
    });

    return { expirados, a_expirar, todos: ativos };
  }, [ativos]);

  const visibleItems =
    tab === 'expirados'
      ? categorized.expirados
      : tab === 'a_expirar'
      ? categorized.a_expirar
      : categorized.todos;

  const handleCriarTrabalho = (ativo: AtivoComCondominio) => {
    const params = new URLSearchParams({
      condominio: String(ativo.id_condominio),
      titulo: `Renovação: ${ativo.nome}`,
    });
    navigate(`/trabalhos?${params.toString()}`);
  };

  if (loading) return <LoadingSpinner />;

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      key: 'expirados',
      label: 'Expirados',
      count: categorized.expirados.length,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    },
    {
      key: 'a_expirar',
      label: 'A expirar (30 dias)',
      count: categorized.a_expirar.length,
      icon: <Clock className="h-4 w-4 text-orange-500" />,
    },
    {
      key: 'todos',
      label: 'Todos',
      count: categorized.todos.length,
      icon: <ShieldCheck className="h-4 w-4 text-primary" />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Conformidade
        </h1>
        <p className="text-muted-foreground text-sm">
          Ativos e licenças de todos os edifícios — vista global
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{categorized.expirados.length}</p>
          <p className="text-xs text-red-600 font-medium mt-1">Expirados</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-700">{categorized.a_expirar.length}</p>
          <p className="text-xs text-orange-600 font-medium mt-1">A expirar em 30 dias</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">
            {ativos.length - categorized.expirados.length - categorized.a_expirar.length}
          </p>
          <p className="text-xs text-green-600 font-medium mt-1">Em conformidade</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
            <span className={`text-xs font-bold ml-1 px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
          <ShieldCheck className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">
            {tab === 'expirados'
              ? 'Nenhum ativo expirado'
              : tab === 'a_expirar'
              ? 'Nenhum ativo a expirar nos próximos 30 dias'
              : 'Nenhum ativo encontrado'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ativo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Edifício
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Expira em</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleItems.map((a) => {
                const status = getExpiryStatus(a.data_expiracao, a.data_proxima_manutencao);
                const rowHighlight =
                  status === 'overdue'
                    ? 'bg-red-50/50'
                    : status === 'soon'
                    ? 'bg-orange-50/40'
                    : '';
                return (
                  <tr key={a.id_ativo} className={`hover:bg-muted/20 transition-colors ${rowHighlight}`}>
                    <td className="py-3 px-4 font-medium">{a.nome}</td>
                    <td className="py-3 px-4">
                      {a.tipo_ativo ? (
                        <Badge variant="secondary" className="text-xs">
                          {tipoAtivoLabels[a.tipo_ativo] || a.tipo_ativo}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {(a as any).condominios?.nome || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {a.data_expiracao ? (
                        <span className={status === 'overdue' ? 'text-red-700 font-medium' : ''}>
                          {format(new Date(a.data_expiracao), 'dd MMM yyyy', { locale: pt })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCriarTrabalho(a)}
                        className="text-xs gap-1.5"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Criar trabalho
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
