import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOcorrencias } from '@/context/OcorrenciasContext';
import { useCondominios } from '@/context/CondominiosContext';
import { Ocorrencia, CreateOcorrenciaData } from '@/api/ocorrencias';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OcorrenciaForm } from '@/components/OcorrenciaForm/OcorrenciaForm';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Plus, ClipboardList, AlertTriangle, Eye, Edit, Trash2, LayoutList, Columns, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-300' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-700 border-green-300' },
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

const estadoSequence: Ocorrencia['estado'][] = ['reportada', 'triagem', 'em_progresso', 'resolvida', 'fechada'];

export const OcorrenciasPage: React.FC = () => {
  const navigate = useNavigate();
  const { ocorrencias, loading, createOcorrencia, updateOcorrencia, deleteOcorrencia } = useOcorrencias();
  const { condominios } = useCondominios();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondominio, setFilterCondominio] = useState('all');
  const [filterPrioridade, setFilterPrioridade] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterResponsabilidade, setFilterResponsabilidade] = useState('all');

  const filtered = useMemo(() => {
    return ocorrencias
      .filter((o) => {
        if (searchTerm && !o.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterCondominio !== 'all' && String(o.id_condominio) !== filterCondominio) return false;
        if (filterPrioridade !== 'all' && o.prioridade !== filterPrioridade) return false;
        if (filterEstado !== 'all' && o.estado !== filterEstado) return false;
        if (filterResponsabilidade !== 'all' && o.responsabilidade !== filterResponsabilidade) return false;
        return true;
      })
      .sort((a, b) => {
        const order = { critica: 0, alta: 1, media: 2, baixa: 3 };
        return (order[a.prioridade] ?? 4) - (order[b.prioridade] ?? 4);
      });
  }, [ocorrencias, searchTerm, filterCondominio, filterPrioridade, filterEstado, filterResponsabilidade]);

  const openOcorrencias = ocorrencias.filter((o) => !['resolvida', 'fechada'].includes(o.estado));

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Ocorrências
          </h1>
          <p className="text-muted-foreground text-sm">{openOcorrencias.length} ocorrências em aberto</p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Ocorrência
          </Button>
        </div>
      </div>

      {/* Summary cards */}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Pesquisar por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
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
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="reportada">Reportada</SelectItem>
            <SelectItem value="triagem">Triagem</SelectItem>
            <SelectItem value="em_progresso">Em Progresso</SelectItem>
            <SelectItem value="resolvida">Resolvida</SelectItem>
            <SelectItem value="fechada">Fechada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterResponsabilidade} onValueChange={setFilterResponsabilidade}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="condominio">Condomínio</SelectItem>
            <SelectItem value="fracao">Fração</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List view */}
      {viewMode === 'lista' && (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
            <ClipboardList className="h-12 w-12 mb-3 opacity-50" />
            <h3 className="text-lg font-medium">Sem ocorrências</h3>
            <p className="text-sm">Nenhuma ocorrência encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const priorCfg = prioridadeConfig[o.prioridade];
              const estadoCfg = estadoConfig[o.estado];
              return (
                <Card key={o.id_ocorrencia} className="hover:shadow-md transition-shadow">
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
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/ocorrencias/${o.id_ocorrencia}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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
            })}
          </div>
        )
      )}

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {estadoSequence.map((colEstado) => {
              const colCfg = estadoConfig[colEstado];
              const colItems = filtered.filter((o) => o.estado === colEstado);
              const colIdx = estadoSequence.indexOf(colEstado);
              return (
                <div key={colEstado} className="w-64 flex-shrink-0">
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-b-2 mb-2 ${colCfg?.color}`}>
                    <span className="text-xs font-semibold uppercase tracking-wide">{colCfg?.label}</span>
                    <span className="text-xs font-bold bg-white/50 rounded-full px-2 py-0.5">{colItems.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="space-y-2 min-h-[120px]">
                    {colItems.map((o) => {
                      const priorCfg = prioridadeConfig[o.prioridade];
                      return (
                        <div
                          key={o.id_ocorrencia}
                          className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorCfg?.color}`}>
                              {priorCfg?.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {categoriaLabels[o.categoria] || o.categoria}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-snug line-clamp-2 mb-1">{o.titulo}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {getCondominioNome(o.id_condominio)}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <div className="flex gap-1">
                              {colIdx > 0 && (
                                <button
                                  onClick={() => handleMoveEstado(o, 'prev')}
                                  className="h-6 w-6 rounded border hover:bg-muted flex items-center justify-center"
                                  title={`← ${estadoConfig[estadoSequence[colIdx - 1]]?.label}`}
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {colIdx < estadoSequence.length - 1 && (
                                <button
                                  onClick={() => handleMoveEstado(o, 'next')}
                                  className="h-6 w-6 rounded border hover:bg-muted flex items-center justify-center"
                                  title={`→ ${estadoConfig[estadoSequence[colIdx + 1]]?.label}`}
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => navigate(`/ocorrencias/${o.id_ocorrencia}`)}
                              className="h-6 w-6 rounded border hover:bg-muted flex items-center justify-center"
                              title="Ver detalhes"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {colItems.length === 0 && (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                        Sem ocorrências
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
