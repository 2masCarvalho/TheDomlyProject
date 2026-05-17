import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { GenerateRelatorioModal } from '@/components/GenerateRelatorioModal/GenerateRelatorioModal';
import { useToast } from '@/hooks/use-toast';
import { useCondominios } from '@/context/CondominiosContext';
import { formatPeriodPt, relatoriosApi, type RelatorioMensalWithCondo } from '@/api/relatorios';

function StatusChip({ status }: { status: RelatorioMensalWithCondo['status'] }) {
  if (status === 'ready') {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Pronto
      </Badge>
    );
  }
  if (status === 'pending' || status === 'generating') {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        {status === 'pending' ? 'Em fila' : 'A gerar'}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
      <AlertCircle className="h-3 w-3 mr-1" /> Falhou
    </Badge>
  );
}

export const RelatoriosPage: React.FC = () => {
  const { toast } = useToast();
  const { condominios } = useCondominios();
  const [reports, setReports] = useState<RelatorioMensalWithCondo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [condoFilter, setCondoFilter] = useState<string>('all');

  async function load() {
    try {
      setLoading(true);
      const data = await relatoriosApi.listMine();
      setReports(data);
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message ?? 'Não foi possível carregar relatórios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (condoFilter === 'all') return reports;
    return reports.filter((r) => String(r.id_condominio) === condoFilter);
  }, [reports, condoFilter]);

  const unviewedCount = useMemo(
    () => reports.filter((r) => !r.viewed_at && r.status === 'ready').length,
    [reports],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Relatórios mensais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resumo executivo automático por condomínio · {reports.length} relatório
            {reports.length === 1 ? '' : 's'}
            {unviewedCount > 0 ? ` · ${unviewedCount} não visto${unviewedCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar agora
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={condoFilter} onValueChange={setCondoFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os condomínios</SelectItem>
            {condominios.map((c) => (
              <SelectItem key={c.id_comdominio} value={String(c.id_comdominio)}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sem relatórios"
          message="No dia 1 de cada mês o sistema gera automaticamente um resumo por condomínio. Pode também usar Gerar agora para criar um para um mês específico."
          cta={
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar o primeiro relatório
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Link key={r.id_relatorio} to={`/relatorios/${r.id_relatorio}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {formatPeriodPt(r.ano, r.mes)}
                      </p>
                      <p className="font-semibold truncate" title={r.condominio?.nome ?? ''}>
                        {r.condominio?.nome ?? 'Condomínio'}
                      </p>
                    </div>
                    <StatusChip status={r.status} />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {(r.data_json?.ocorrencias?.opened ?? 0)} ocorrência
                      {(r.data_json?.ocorrencias?.opened ?? 0) === 1 ? '' : 's'}
                    </span>
                    <span>·</span>
                    <span>
                      {(r.data_json?.trabalhos?.concluded ?? 0)} trabalho
                      {(r.data_json?.trabalhos?.concluded ?? 0) === 1 ? '' : 's'} concluído
                      {(r.data_json?.trabalhos?.concluded ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>

                  {!r.viewed_at && r.status === 'ready' ? (
                    <Badge variant="outline" className="text-[10px]">Não visto</Badge>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <GenerateRelatorioModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) void load();
        }}
      />
    </div>
  );
};
