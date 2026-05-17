import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOcorrencias } from '@/context/OcorrenciasContext';
import { useCondominios } from '@/context/CondominiosContext';
import { Ocorrencia, CreateOcorrenciaData } from '@/api/ocorrencias';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OcorrenciaForm } from '@/components/OcorrenciaForm/OcorrenciaForm';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CardListSkeleton } from '@/components/skeletons/CardListSkeleton';
import {
  Plus, ClipboardList, AlertTriangle, Eye, Edit, Trash2,
  LayoutList, Columns, ChevronLeft, ChevronRight, Archive,
  CheckCircle2, Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/EmptyState';

const prioridadeConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-300', dotColor: 'bg-red-500' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-300', dotColor: 'bg-orange-500' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', dotColor: 'bg-amber-400' },
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-700 border-green-300', dotColor: 'bg-emerald-500' },
};

const estadoConfig: Record<string, { label: string; color: string }> = {
  reportada: { label: 'Reportada', color: 'bg-blue-100 text-blue-700' },
  triagem: { label: 'Triagem', color: 'bg-purple-100 text-purple-700' },
  em_progresso: { label: 'Em Progresso', color: 'bg-orange-100 text-orange-700' },
  resolvida: { label: 'Resolvida', color: 'bg-green-100 text-green-700' },
  fechada: { label: 'Fechada', color: 'bg-gray-100 text-gray-600' },
};

const categoriaLabels: Record<string, string> = {
  estrutural: 'Estrutural',
  'canalização': 'Canalização',
  eletricidade: 'Eletricidade',
  elevador: 'Elevador',
  zona_comum: 'Zona Comum',
  seguranca_incendio: 'Seg. Incêndio',
  outro: 'Outro',
};

// Kanban only shows active states (not fechada)
const kanbanEstados: Ocorrencia['estado'][] = ['reportada', 'triagem', 'em_progresso', 'resolvida'];
const estadoSequence: Ocorrencia['estado'][] = ['reportada', 'triagem', 'em_progresso', 'resolvida', 'fechada'];

export const OcorrenciasPage: React.FC = () => {
  const navigate = useNavigate();
  const { ocorrencias, loading, createOcorrencia, updateOcorrencia, deleteOcorrencia } = useOcorrencias();
  const { condominios } = useCondominios();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondominio, setFilterCondominio] = useState('all');
  const [filterPrioridade, setFilterPrioridade] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterResponsabilidade, setFilterResponsabilidade] = useState('all');

  // Split: ativas = not fechada, historico = fechada
  const ativas = useMemo(() => ocorrencias.filter((o) => o.estado !== 'fechada'), [ocorrencias]);
  const historico = useMemo(() => ocorrencias.filter((o) => o.estado === 'fechada'), [ocorrencias]);

  const currentList = activeTab === 'ativas' ? ativas : historico;

  const filtered = useMemo(() => {
    return currentList
      .filter((o) => {
        if (searchTerm && !o.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterCondominio !== 'all' && String(o.id_condominio) !== filterCondominio) return false;
        if (filterPrioridade !== 'all' && o.prioridade !== filterPrioridade) return false;
        if (filterEstado !== 'all' && o.estado !== filterEstado) return false;
        if (filterResponsabilidade !== 'all' && o.responsabilidade !== filterResponsabilidade) return false;
        return true;
      })
      .sort((a, b) => {
        if (activeTab === 'historico') {
          // Historico: most recently closed first
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
        }
        const order = { critica: 0, alta: 1, media: 2, baixa: 3 };
        return (order[a.prioridade] ?? 4) - (order[b.prioridade] ?? 4);
      });
  }, [currentList, searchTerm, filterCondominio, filterPrioridade, filterEstado, filterResponsabilidade, activeTab]);

  const openOcorrencias = useMemo(() => ativas.filter((o) => !['resolvida'].includes(o.estado)), [ativas]);

  const summaryByPriority = useMemo(() => ({
    critica: openOcorrencias.filter((o) => o.prioridade === 'critica').length,
    alta: openOcorrencias.filter((o) => o.prioridade === 'alta').length,
    media: openOcorrencias.filter((o) => o.prioridade === 'media').length,
    baixa: openOcorrencias.filter((o) => o.prioridade === 'baixa').length,
  }), [openOcorrencias]);

  const handleCreate = () => { setSelectedOcorrencia(null); setIsFormOpen(true); };
  const handleEdit = (o: Ocorrencia) => { setSelectedOcorrencia(o); setIsFormOpen(true); };
  const handleDelete = (o: Ocorrencia) => { setSelectedOcorrencia(o); setIsDeleteOpen(true); };

  const handleFormSubmit = async (data: CreateOcorrenciaData) => {
    if (selectedOcorrencia) {
      await updateOcorrencia(selectedOcorrencia.id_ocorrencia, data);
    } else {
      await createOcorrencia(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedOcorrencia) {
      await deleteOcorrencia(selectedOcorrencia.id_ocorrencia);
      setIsDeleteOpen(false);
      setSelectedOcorrencia(null);
    }
  };

  const handleMoveEstado = async (o: Ocorrencia, direction: 'prev' | 'next') => {
    const idx = estadoSequence.indexOf(o.estado);
    const newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= estadoSequence.length) return;
    const newEstado = estadoSequence[newIdx];
    try {
      await updateOcorrencia(o.id_ocorrencia, { estado: newEstado } as any);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o estado.', variant: 'destructive' });
    }
  };

  const getCondominioNome = (id: number) => condominios.find((c) => c.id_comdominio === id)?.nome || '—';

  // Reset filters when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'ativas' | 'historico');
    setSearchTerm('');
    setFilterCondominio('all');
    setFilterPrioridade('all');
    setFilterEstado('all');
    setFilterResponsabilidade('all');
  };

  if (loading) {
    return (
      <div className="p-6">
        <CardListSkeleton rows={5} />
      </div>
    );
  }

  // ── Render helpers ────────────────────────────────────

  const renderOcorrenciaCard = (o: Ocorrencia) => {
    const priorCfg = prioridadeConfig[o.prioridade];
    const estadoCfg = estadoConfig[o.estado];
    return (
      <Card key={o.id_ocorrencia} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/ocorrencias/${o.id_ocorrencia}`)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className={`text-xs ${priorCfg?.color}`}>
                  {priorCfg?.label}
                </Badge>
                <Badge variant="secondary" className={`text-xs ${estadoCfg?.color}`}>
                  {estadoCfg?.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {categoriaLabels[o.categoria] || o.categoria}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {o.responsabilidade === 'condominio' ? 'Condomínio' : 'Fração'}
                </span>
              </div>
              <p className="font-semibold truncate">{o.titulo}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getCondominioNome(o.id_condominio)} · {format(new Date(o.created_at), 'dd MMM yyyy', { locale: pt })}
                {o.reportado_por && ` · ${o.reportado_por}`}
                {o.resolved_at && (
                  <> · Resolvida {format(new Date(o.resolved_at), 'dd MMM yyyy', { locale: pt })}</>
                )}
              </p>
            </div>
            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={() => handleEdit(o)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(o)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <div className="flex flex-wrap gap-3">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Pesquisar por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filterCondominio} onValueChange={setFilterCondominio}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Condomínio" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {condominios.map((c) => (
            <SelectItem key={c.id_comdominio} value={String(c.id_comdominio)}>{c.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="critica">Crítica</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Média</SelectItem>
          <SelectItem value="baixa">Baixa</SelectItem>
        </SelectContent>
      </Select>
      {activeTab === 'ativas' && (
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="reportada">Reportada</SelectItem>
            <SelectItem value="triagem">Triagem</SelectItem>
            <SelectItem value="em_progresso">Em Progresso</SelectItem>
            <SelectItem value="resolvida">Resolvida</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Select value={filterResponsabilidade} onValueChange={setFilterResponsabilidade}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="condominio">Condomínio</SelectItem>
          <SelectItem value="fracao">Fração</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderEmpty = (message: string) => (
    <EmptyState
      icon={ClipboardList}
      title="Sem ocorrências"
      message={message}
      cta={
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Registar ocorrência
        </Button>
      }
    />
  );

  const renderKanban = () => (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {kanbanEstados.map((colEstado) => {
          const colCfg = estadoConfig[colEstado];
          const colItems = filtered.filter((o) => o.estado === colEstado);
          const colIdx = estadoSequence.indexOf(colEstado);
          return (
            <div key={colEstado} className="w-64 flex-shrink-0">
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-b-2 mb-2 ${colCfg?.color}`}>
                <span className="text-xs font-semibold uppercase tracking-wide">{colCfg?.label}</span>
                <span className="text-xs font-bold bg-white/50 rounded-full px-2 py-0.5">{colItems.length}</span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {colItems.map((o) => {
                  const priorCfg = prioridadeConfig[o.prioridade];
                  return (
                    <div key={o.id_ocorrencia} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorCfg?.color}`}>
                          {priorCfg?.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {categoriaLabels[o.categoria] || o.categoria}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug line-clamp-2 mb-1">{o.titulo}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{getCondominioNome(o.id_condominio)}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <div className="flex gap-1">
                          {colIdx > 0 && (
                            <button onClick={() => handleMoveEstado(o, 'prev')} className="h-6 w-6 rounded border hover:bg-muted flex items-center justify-center" title={`← ${estadoConfig[estadoSequence[colIdx - 1]]?.label}`}>
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {colIdx < estadoSequence.length - 1 && (
                            <button onClick={() => handleMoveEstado(o, 'next')} className="h-6 w-6 rounded border hover:bg-muted flex items-center justify-center" title={`→ ${estadoConfig[estadoSequence[colIdx + 1]]?.label}`}>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <button onClick={() => navigate(`/ocorrencias/${o.id_ocorrencia}`)} className="h-6 w-6 rounded border hover:bg-muted flex items-center justify-center" title="Ver detalhes">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground bg-muted/30">
                    Sem ocorrências
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Ocorrências
          </h1>
          <p className="text-muted-foreground text-sm">
            {ativas.length} ativa{ativas.length !== 1 ? 's' : ''} · {historico.length} no histórico
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'ativas' && (
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'lista' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                onClick={() => setViewMode('lista')}
              >
                <LayoutList className="h-4 w-4" /> Lista
              </button>
              <button
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                onClick={() => setViewMode('kanban')}
              >
                <Columns className="h-4 w-4" /> Kanban
              </button>
            </div>
          )}
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Ocorrência
          </Button>
        </div>
      </div>

      {/* Summary cards (only on ativas tab) */}
      {activeTab === 'ativas' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summaryByPriority).map(([prioridade, count]) => {
            const cfg = prioridadeConfig[prioridade];
            return (
              <Card key={prioridade} className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{cfg.label}</span>
                    {prioridade === 'critica' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabs: Ativas / Histórico */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-white border border-slate-200/60 p-1 rounded-xl">
          <TabsTrigger value="ativas" className="text-xs rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Ativas
            <span className="ml-1 text-[10px] opacity-60 bg-white/20 px-1.5 py-0.5 rounded-full">{ativas.length}</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            Histórico
            <span className="ml-1 text-[10px] opacity-60 bg-white/20 px-1.5 py-0.5 rounded-full">{historico.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Ativas ──────────────────────────────── */}
        <TabsContent value="ativas" className="space-y-4 mt-4">
          {renderFilters()}

          {viewMode === 'lista' ? (
            filtered.length === 0
              ? renderEmpty('Nenhuma ocorrência ativa com os filtros aplicados.')
              : <div className="space-y-3">{filtered.map(renderOcorrenciaCard)}</div>
          ) : (
            renderKanban()
          )}
        </TabsContent>

        {/* ── Tab: Histórico ───────────────────────────── */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          {renderFilters()}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
              <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-200" />
              <h3 className="text-lg font-medium">Sem histórico</h3>
              <p className="text-sm">As ocorrências fechadas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((o) => {
                const priorCfg = prioridadeConfig[o.prioridade];
                return (
                  <Card key={o.id_ocorrencia} className="hover:shadow-md transition-shadow opacity-80 hover:opacity-100 cursor-pointer" onClick={() => navigate(`/ocorrencias/${o.id_ocorrencia}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${priorCfg?.color}`}>
                              {priorCfg?.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                              Fechada
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {categoriaLabels[o.categoria] || o.categoria}
                            </span>
                          </div>
                          <p className="font-semibold truncate">{o.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getCondominioNome(o.id_condominio)}
                            {' · Criada '}
                            {format(new Date(o.created_at), 'dd MMM yyyy', { locale: pt })}
                            {o.resolved_at && (
                              <> · Resolvida {format(new Date(o.resolved_at), 'dd MMM yyyy', { locale: pt })}</>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(o)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <OcorrenciaForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={selectedOcorrencia}
      />

      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Eliminar Ocorrência"
        description={`Tem a certeza que pretende eliminar a ocorrência "${selectedOcorrencia?.titulo}"?`}
      />
    </div>
  );
};