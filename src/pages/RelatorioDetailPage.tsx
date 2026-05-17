import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import {
  formatPeriodPt,
  relatoriosApi,
  type RelatorioMensalWithCondo,
} from '@/api/relatorios';
import { generateRelatorioPdf } from '@/lib/relatorioPdf';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6b7280'];

const PRIORIDADE_COLORS: Record<string, string> = {
  critica: '#dc2626',
  alta: '#ea580c',
  media: '#ca8a04',
  baixa: '#6b7280',
};

function Delta({ current, previous }: { current: number; previous: number }) {
  if (current === previous) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Minus className="h-3 w-3" /> igual
      </span>
    );
  }
  const up = current > previous;
  const diff = current - previous;
  return (
    <span
      className={`text-xs flex items-center gap-1 ${up ? 'text-amber-600' : 'text-emerald-600'}`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {diff} vs. mês anterior
    </span>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {hint}
      </CardContent>
    </Card>
  );
}

function renderMarkdown(md: string) {
  return md
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className="text-sm leading-relaxed text-foreground/90">
        {p}
      </p>
    ));
}

export const RelatorioDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [report, setReport] = useState<RelatorioMensalWithCondo | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [polling, setPolling] = useState(false);

  async function load(silent = false) {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      const data = await relatoriosApi.getById(id);
      setReport(data);
      // Mark as viewed on first ready load
      if (data && data.status === 'ready' && !data.viewed_at) {
        await relatoriosApi.markViewed(id);
      }
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message ?? 'Não foi possível carregar o relatório.',
        variant: 'destructive',
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  // Poll while pending/generating, every 3 seconds.
  useEffect(() => {
    if (!report) return;
    if (report.status !== 'pending' && report.status !== 'generating') return;
    setPolling(true);
    const t = setInterval(() => void load(true), 3000);
    return () => {
      clearInterval(t);
      setPolling(false);
    };
  }, [report?.status]);

  async function handleRetry() {
    if (!id) return;
    setRetrying(true);
    try {
      const updated = await relatoriosApi.regenerateNarrative(id);
      setReport(updated);
      toast({ title: 'Resumo gerado', description: 'A IA produziu uma nova versão.' });
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message ?? 'Não foi possível regenerar o resumo.',
        variant: 'destructive',
      });
    } finally {
      setRetrying(false);
    }
  }

  async function handleDownload() {
    if (!report) return;
    setDownloading(true);
    try {
      const blob = await generateRelatorioPdf(report);
      const url = URL.createObjectURL(blob);
      const fileName = `relatorio-${report.condominio?.nome?.replace(/\s+/g, '-').toLowerCase() ?? 'condominio'}-${report.ano}-${String(report.mes).padStart(2, '0')}.pdf`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'PDF gerado', description: fileName });
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message ?? 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  }

  const categoriaPieData = useMemo(() => {
    const byCat = report?.data_json?.ocorrencias?.by_categoria ?? {};
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [report]);

  const prioridadeBarData = useMemo(() => {
    const byPri = report?.data_json?.ocorrencias?.by_prioridade ?? {};
    const order = ['critica', 'alta', 'media', 'baixa'];
    return order
      .filter((p) => byPri[p] != null)
      .map((p) => ({ name: p, value: byPri[p] }));
  }, [report]);

  const trabalhosCategoriaData = useMemo(() => {
    const byCat = report?.data_json?.trabalhos?.by_categoria ?? {};
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [report]);

  if (loading) return <LoadingSpinner />;
  if (!report) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
        <Link to="/relatorios">
          <Button variant="link" className="px-0">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const oc = report.data_json?.ocorrencias;
  const tr = report.data_json?.trabalhos;
  const mn = report.data_json?.manutencoes;
  const at = report.data_json?.ativos;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link to="/relatorios" className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Todos os relatórios
          </Link>
          <h1 className="text-2xl font-bold">{report.condominio?.nome ?? 'Condomínio'}</h1>
          <p className="text-muted-foreground capitalize">{formatPeriodPt(report.ano, report.mes)}</p>
        </div>
        <div className="flex items-center gap-2">
          {report.status === 'ready' ? (
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descarregar PDF
            </Button>
          ) : null}
        </div>
      </div>

      {/* Status states */}
      {report.status === 'pending' || report.status === 'generating' ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="font-medium">
              {report.status === 'pending' ? 'Em fila para geração…' : 'A gerar resumo executivo…'}
            </p>
            <p className="text-sm text-muted-foreground">
              A IA está a redigir o resumo. Demora cerca de 10 segundos.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {report.status === 'failed' ? (
        <Card className="border-red-200">
          <CardContent className="py-6 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-medium">Falha a gerar o resumo</p>
                <p className="text-sm text-muted-foreground">
                  {report.error_message ?? 'Erro desconhecido.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry} disabled={retrying}>
                {retrying ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Tentar de novo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Executive summary */}
      {report.summary_md ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo executivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">{renderMarkdown(report.summary_md)}</CardContent>
        </Card>
      ) : null}

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Ocorrências reportadas"
          value={oc?.opened ?? 0}
          hint={<Delta current={oc?.opened ?? 0} previous={oc?.opened_prev_month ?? 0} />}
        />
        <KpiCard label="Ocorrências resolvidas" value={oc?.resolved ?? 0} />
        <KpiCard label="Trabalhos concluídos" value={tr?.concluded ?? 0} />
        <KpiCard
          label="Investimento manutenção"
          value={new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(mn?.total_cost ?? 0)}
          hint={<span className="text-xs text-muted-foreground">{mn?.count ?? 0} intervenções</span>}
        />
        <KpiCard
          label="Ativos não conformes"
          value={at?.out_of_compliance ?? 0}
          hint={
            <span className="text-xs text-muted-foreground">
              de {at?.total ?? 0} ativos no edifício
            </span>
          }
        />
        <KpiCard
          label="Expiram no próximo mês"
          value={at?.expiring_next_month ?? 0}
        />
        <KpiCard
          label="Em aberto no fim do mês"
          value={oc?.still_open_at_end ?? 0}
        />
        <KpiCard
          label="Pendentes de renovação"
          value={at?.pending_renovacao ?? 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ocorrências por categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {categoriaPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem ocorrências este mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriaPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={85}
                    label={(entry: any) => `${entry.name}: ${entry.value}`}
                  >
                    {categoriaPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ocorrências por prioridade</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {prioridadeBarData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prioridadeBarData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {prioridadeBarData.map((entry, i) => (
                      <Cell key={i} fill={PRIORIDADE_COLORS[entry.name] ?? '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {trabalhosCategoriaData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Trabalhos de manutenção por categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trabalhosCategoriaData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ocorrências mais recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {!oc?.top_recent || oc.top_recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma ocorrência registada este mês.</p>
            ) : (
              <div className="space-y-2">
                {oc.top_recent.map((o) => (
                  <div key={o.id} className="flex items-start justify-between gap-3 text-sm border-b last:border-b-0 pb-2 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{o.titulo}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {o.categoria} · {o.estado.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0"
                      style={{
                        borderColor: PRIORIDADE_COLORS[o.prioridade] ?? '#6b7280',
                        color: PRIORIDADE_COLORS[o.prioridade] ?? '#6b7280',
                      }}
                    >
                      {o.prioridade}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ativos a expirar (60 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {!at?.expiring_list || at.expiring_list.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ativo a expirar nos próximos 60 dias.</p>
            ) : (
              <div className="space-y-2">
                {at.expiring_list.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b last:border-b-0 pb-2 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{a.tipo_ativo ?? '—'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.data_expiracao).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {polling && (
        <p className="text-xs text-muted-foreground text-center">A atualizar…</p>
      )}
    </div>
  );
};
